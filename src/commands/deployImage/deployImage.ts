/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerAppsAPIClient } from "@azure/arm-appcontainers";
import { VerifyProvidersStep } from "@microsoft/vscode-azext-azureutils";
import { AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, ITreeItemPickerContext } from "@microsoft/vscode-azext-utils";
import { MessageItem, ProgressLocation, window } from "vscode";
import { RevisionConstants, rootFilter, webProvider } from "../../constants";
import { ext } from "../../extensionVariables";
import { ContainerAppTreeItem } from "../../tree/ContainerAppTreeItem";
import { createContainerAppsAPIClient } from "../../utils/azureClients";
import { localize } from "../../utils/localize";
import { nonNullValue } from "../../utils/nonNull";
import { EnvironmentVariablesListStep } from "../createContainerApp/EnvironmentVariablesListStep";
import { getLoginServer } from "../createContainerApp/getLoginServer";
import { showContainerAppCreated } from "../createContainerApp/showContainerAppCreated";
import { listCredentialsFromRegistry } from "./acr/listCredentialsFromRegistry";
import { ContainerRegistryListStep } from "./ContainerRegistryListStep";
import { getContainerNameForImage } from "./getContainerNameForImage";
import { IDeployImageContext } from "./IDeployImageContext";

export async function deployImage(context: ITreeItemPickerContext & Partial<IDeployImageContext>, node?: ContainerAppTreeItem): Promise<void> {
    if (!node) {
        context.suppressCreatePick = true;
        node = await ext.rgApi.pickAppResource<ContainerAppTreeItem>(context, {
            filter: rootFilter,
            expectedChildContextValue: ContainerAppTreeItem.contextValueRegExp
        });
    }

    const wizardContext: IDeployImageContext = { ...context, ...node.subscription, targetContainer: node.data };

    if (hasUnsupportedFeatures(node)) {
        const warning: string = node.getRevisionMode() === RevisionConstants.single.data ?
            localize('confirmDeploySingle', 'Are you sure you want to deploy to "{0}"? This will overwrite the active revision and unsupported features in VS Code will be lost.', node.name) :
            localize('confirmDeployMultiple', 'Are you sure you want to deploy to "{0}"? Unsupported features in VS Code will be lost in the new revision.', node.name);

        const items: MessageItem[] = [{ title: localize('deploy', 'Deploy') }];
        await context.ui.showWarningMessage(warning, { modal: true, stepName: 'confirmDestructiveDeployment' }, ...items);
    }

    const title: string = localize('updateImage', 'Update image in "{0}"', node.name);
    const promptSteps: AzureWizardPromptStep<IDeployImageContext>[] =
        [new ContainerRegistryListStep(), new EnvironmentVariablesListStep()];
    const executeSteps: AzureWizardExecuteStep<IDeployImageContext>[] = [new VerifyProvidersStep([webProvider])];

    const wizard: AzureWizard<IDeployImageContext> = new AzureWizard(wizardContext, {
        title,
        promptSteps,
        executeSteps,
        showLoadingPrompt: true
    });

    await wizard.prompt();
    await wizard.execute();

    const containerAppEnvelope = await node.getContainerEnvelopeWithSecrets(wizardContext);

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

    const creatingRevision = localize('creatingRevision', 'Creating a new revision for container app "{0}"...', node.name);
    await node.runWithTemporaryDescription(context, localize('addingContainer', 'Creating...'), async () => {
        await window.withProgress({ location: ProgressLocation.Notification, title: creatingRevision }, async (): Promise<void> => {
            node = nonNullValue(node);
            const webClient: ContainerAppsAPIClient = await createContainerAppsAPIClient([wizardContext, node]);

            ext.outputChannel.appendLog(creatingRevision);
            node.data = await webClient.containerApps.beginCreateOrUpdateAndWait(node.resourceGroupName, node.name, containerAppEnvelope);

            void showContainerAppCreated(node, true);
        });
    });

    await node.refresh(context);
}

// check for any portal features that VS Code doesn't currently support
function hasUnsupportedFeatures(node: ContainerAppTreeItem): boolean {
    if (node.data.template?.volumes) {
        return true;
    } else if (node.data.template?.containers) {
        if (node.data.template.containers.length > 1) {
            return true;
        }

        for (const container of node.data.template.containers) {
            // NOTE: these are all arrays so if they are empty, this will still return true
            // but these should be undefined if not being utilized
            return !!container.probes || !!container.volumeMounts || !!container.args;
        }
    }

    return false;
}
