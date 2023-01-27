/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerApp, KnownActiveRevisionsMode } from "@azure/arm-appcontainers";
import { VerifyProvidersStep } from "@microsoft/vscode-azext-azureutils";
import { AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, ITreeItemPickerContext } from "@microsoft/vscode-azext-utils";
import { MessageItem, ProgressLocation, window } from "vscode";
import { webProvider } from "../../constants";
import { ext } from "../../extensionVariables";
import { ContainerAppItem, getContainerEnvelopeWithSecrets, refreshContainerApp } from "../../tree/ContainerAppItem";
import { createSubscriptionContext } from "../../tree/ContainerAppsBranchDataProvider";
import { localize } from "../../utils/localize";
import { pickContainerApp } from "../../utils/pickContainerApp";
import { EnvironmentVariablesListStep } from "../createContainerApp/EnvironmentVariablesListStep";
import { getLoginServer } from "../createContainerApp/getLoginServer";
import { showContainerAppCreated } from "../createContainerApp/showContainerAppCreated";
import { listCredentialsFromRegistry } from "./acr/listCredentialsFromRegistry";
import { ContainerRegistryListStep } from "./ContainerRegistryListStep";
import { getContainerNameForImage } from "./getContainerNameForImage";
import { IDeployImageContext } from "./IDeployImageContext";

export async function deployImage(context: ITreeItemPickerContext & Partial<IDeployImageContext>, node?: ContainerAppItem): Promise<void> {
    if (!node) {
        context.suppressCreatePick = true;
        node = await pickContainerApp(context);
    }
    const { subscription, containerApp } = node;

    const wizardContext: IDeployImageContext = {
        ...context,
        ...createSubscriptionContext(subscription),
        targetContainer: containerApp
    };

    if (hasUnsupportedFeatures(containerApp)) {
        const warning: string = containerApp.revisionsMode === KnownActiveRevisionsMode.Single ?
            localize('confirmDeploySingle', 'Are you sure you want to deploy to "{0}"? This will overwrite the active revision and unsupported features in VS Code will be lost.', containerApp.name) :
            localize('confirmDeployMultiple', 'Are you sure you want to deploy to "{0}"? Unsupported features in VS Code will be lost in the new revision.', containerApp.name);

        const items: MessageItem[] = [{ title: localize('deploy', 'Deploy') }];
        await context.ui.showWarningMessage(warning, { modal: true, stepName: 'confirmDestructiveDeployment' }, ...items);
    }

    const title: string = localize('updateImage', 'Update image in "{0}"', containerApp.name);
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

    const containerAppEnvelope = await getContainerEnvelopeWithSecrets(context, subscription, containerApp);

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
    containerAppEnvelope.template.containers.push({
        env: wizardContext.environmentVariables,
        image: wizardContext.image,
        name: getContainerNameForImage(wizardContext.image),
    });

    const creatingRevision = localize('creatingRevision', 'Creating a new revision for container app "{0}"...', containerApp.name);
    await ext.state.runWithTemporaryDescription(containerApp.id, localize('creating', 'Creating...'), async () => {
        await window.withProgress({ location: ProgressLocation.Notification, title: creatingRevision }, async (): Promise<void> => {
            ext.outputChannel.appendLog(creatingRevision);
            const updatedContainerApp = await ContainerAppItem.Get(context, subscription, containerApp.resourceGroup, containerApp.name);
            void showContainerAppCreated(updatedContainerApp, true);
        });

        refreshContainerApp(containerApp.id);
    });
}

// check for any portal features that VS Code doesn't currently support
function hasUnsupportedFeatures(containerApp: ContainerApp): boolean {
    if (containerApp.template?.volumes) {
        return true;
    } else if (containerApp.template?.containers) {
        if (containerApp.template.containers.length > 1) {
            return true;
        }

        for (const container of containerApp.template.containers) {
            // NOTE: these are all arrays so if they are empty, this will still return true
            // but these should be undefined if not being utilized
            return !!container.probes || !!container.volumeMounts || !!container.args;
        }
    }

    return false;
}
