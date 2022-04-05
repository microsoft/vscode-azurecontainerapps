/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerAppsAPIClient } from "@azure/arm-app";
import { VerifyProvidersStep } from "@microsoft/vscode-azext-azureutils";
import { AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, ITreeItemPickerContext } from "@microsoft/vscode-azext-utils";
import { ProgressLocation, window } from "vscode";
import { webProvider } from "../../constants";
import { ext } from "../../extensionVariables";
import { ContainerAppTreeItem } from "../../tree/ContainerAppTreeItem";
import { createContainerAppsAPIClient } from "../../utils/azureClients";
import { localize } from "../../utils/localize";
import { nonNullValue } from "../../utils/nonNull";
import { EnvironmentVariablesListStep } from "../createContainerApp/EnvironmentVariablesListStep";
import { getLoginServer } from "../createContainerApp/getLoginServer";
import { listCredentialsFromRegistry } from "./acr/listCredentialsFromRegistry";
import { ContainerRegistryListStep } from "./ContainerRegistryListStep";
import { IDeployImageContext } from "./IDeployImageContext";

export async function deployImage(context: ITreeItemPickerContext & Partial<IDeployImageContext>, node?: ContainerAppTreeItem): Promise<void> {

    if (!node) {
        context.suppressCreatePick = true;
        node = await ext.tree.showTreeItemPicker<ContainerAppTreeItem>(ContainerAppTreeItem.contextValue, context);
    }

    const wizardContext: IDeployImageContext = { ...context, ...node.subscription, targetContainer: node.data };

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
    containerAppEnvelope.template.containers.push(
        { image: `${getLoginServer(wizardContext)}/${wizardContext.repositoryName}:${wizardContext.tag}`, name: `${wizardContext.repositoryName}-${wizardContext.tag}` }
    )

    const creatingRevision = localize('creatingRevision', 'Creating a new revision for container app "{0}"...', node.name);
    await node.runWithTemporaryDescription(context, localize('addingContainer', 'Creating...'), async () => {
        await window.withProgress({ location: ProgressLocation.Notification, title: creatingRevision }, async (): Promise<void> => {
            node = nonNullValue(node);
            const webClient: ContainerAppsAPIClient = await createContainerAppsAPIClient([wizardContext, node]);

            ext.outputChannel.appendLog(creatingRevision);
            node.data = await webClient.containerApps.beginCreateOrUpdateAndWait(node.resourceGroupName, node.name, containerAppEnvelope);

            const createdRevision = localize('createdRevision', 'Created a new revision "{1}" for container app "{0}"', node.name, node.data.latestRevisionName);
            void window.showInformationMessage(createdRevision);
            ext.outputChannel.appendLog(createdRevision);
        });
    });

    await node.refresh(context);
}
