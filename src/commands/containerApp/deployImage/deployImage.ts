/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerAppsAPIClient } from "@azure/arm-appcontainers";
import { VerifyProvidersStep } from "@microsoft/vscode-azext-azureutils";
import { AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, ITreeItemPickerContext } from "@microsoft/vscode-azext-utils";
import { MessageItem, ProgressLocation, window } from "vscode";
import { appFilter, appProvider, RevisionConstants } from "../../../constants";
import { ext } from "../../../extensionVariables";
import { ContainerAppResource } from "../../../resolver/ContainerAppResource";
import { ContainerAppExtParentTreeItem } from "../../../tree/ContainerAppExtParentTreeItem";
import { createContainerAppsAPIClient } from "../../../utils/azureClients";
import { localize } from "../../../utils/localize";
import { nonNullValue } from "../../../utils/nonNull";
import { EnvironmentVariablesListStep } from "../create/EnvironmentVariablesListStep";
import { getLoginServer } from "../create/getLoginServer";
import { showContainerAppCreated } from "../create/showContainerAppCreated";
import { getRevisionMode } from "../getRevisionMode";
import { listCredentialsFromRegistry } from "./acr/listCredentialsFromRegistry";
import { ContainerRegistryListStep } from "./ContainerRegistryListStep";
import { getContainerEnvelopeWithSecrets } from "./getContainerEnvelopeWithSecrets";
import { getContainerNameForImage } from "./getContainerNameForImage";
import { IDeployImageContext } from "./IDeployImageContext";

export async function deployImage(context: ITreeItemPickerContext & Partial<IDeployImageContext>, node?: ContainerAppExtParentTreeItem<ContainerAppResource>): Promise<void> {

    context.suppressCreatePick = true;
    if (!node) {
        node = await ext.rgApi.pickAppResource(context, {
            filter: appFilter,
        }) as ContainerAppExtParentTreeItem<ContainerAppResource>;
    }

    const wizardContext: IDeployImageContext = { ...context, ...node.subscription, targetContainer: node.resource.data };
    const containerApp: ContainerAppResource = node.resource;

    if (hasUnsupportedFeatures(containerApp)) {
        const warning: string = getRevisionMode(containerApp) === RevisionConstants.single.data ?
            localize('confirmDeploySingle', 'Are you sure you want to deploy to "{0}"? This will overwrite the active revision and unsupported features in VS Code will be lost.', containerApp.name) :
            localize('confirmDeployMultiple', 'Are you sure you want to deploy to "{0}"? Unsupported features in VS Code will be lost in the new revision.', containerApp.name);

        const items: MessageItem[] = [{ title: localize('deploy', 'Deploy') }];
        await context.ui.showWarningMessage(warning, { modal: true, stepName: 'confirmDestructiveDeployment' }, ...items);
    }

    const title: string = localize('updateImage', 'Update image in "{0}"', containerApp.name);
    const promptSteps: AzureWizardPromptStep<IDeployImageContext>[] =
        [new ContainerRegistryListStep(), new EnvironmentVariablesListStep()];
    const executeSteps: AzureWizardExecuteStep<IDeployImageContext>[] = [new VerifyProvidersStep([appProvider])];

    const wizard: AzureWizard<IDeployImageContext> = new AzureWizard(wizardContext, {
        title,
        promptSteps,
        executeSteps,
        showLoadingPrompt: true
    });

    await wizard.prompt();
    await wizard.execute();

    const containerAppEnvelope = await getContainerEnvelopeWithSecrets(wizardContext, containerApp);

    // for ACR
    if (wizardContext.registry) {
        const registry = wizardContext.registry;
        const { username, password } = await listCredentialsFromRegistry(wizardContext, registry);
        const passwordName = `${wizardContext.registry.name?.toLocaleLowerCase()}-${password?.name}`;
        // remove duplicate registry
        containerAppEnvelope.configuration.registries = containerAppEnvelope.configuration.registries?.filter(r => r.server !== registry.loginServer);
        containerAppEnvelope.configuration.registries?.push(
            {
                server: registry.loginServer,
                username: username,
                passwordSecretRef: passwordName
            }
        )

        // remove duplicate secretRef
        containerAppEnvelope.configuration.secrets = containerAppEnvelope.configuration.secrets?.filter(s => s.name !== passwordName);
        containerAppEnvelope.configuration.secrets?.push({ name: passwordName, value: password.value });
    }

    // we want to replace the old image
    containerAppEnvelope.template ||= {};
    containerAppEnvelope.template.containers = [];

    wizardContext.image ||= `${getLoginServer(wizardContext)}/${wizardContext.repositoryName}:${wizardContext.tag}`;
    const name = getContainerNameForImage(wizardContext.image);

    containerAppEnvelope.template.containers.push(
        {
            image: wizardContext.image, name, env: wizardContext.environmentVariables
        }
    )

    const creatingRevision = localize('creatingRevision', 'Creating a new revision for container app "{0}"...', containerApp.name);
    await node.runWithTemporaryDescription(context, localize('addingContainer', 'Creating...'), async () => {
        await window.withProgress({ location: ProgressLocation.Notification, title: creatingRevision }, async (): Promise<void> => {
            node = nonNullValue(node);
            const webClient: ContainerAppsAPIClient = await createContainerAppsAPIClient([wizardContext, containerApp.subscriptionContext]);

            ext.outputChannel.appendLog(creatingRevision);
            containerApp.data = await webClient.containerApps.beginCreateOrUpdateAndWait(containerApp.resourceGroupName, containerApp.name, containerAppEnvelope);

            void showContainerAppCreated(containerApp, true);
        });
    });

    await node.refresh(context);
}

// check for any portal features that VS Code doesn't currently support
function hasUnsupportedFeatures(ca: ContainerAppResource): boolean {
    if (ca.data.template?.volumes) {
        return true;
    } else if (ca.data.template?.containers) {
        if (ca.data.template.containers.length > 1) {
            return true;
        }

        for (const container of ca.data.template.containers) {
            // NOTE: these are all arrays so if they are empty, this will still return true
            // but these should be undefined if not being utilized
            return !!container.probes || !!container.volumeMounts || !!container.args;
        }
    }

    return false;
}
