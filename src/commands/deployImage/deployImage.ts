/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerAppsAPIClient } from "@azure/arm-app";
import { ProgressLocation, window } from "vscode";
import { AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, IActionContext, VerifyProvidersStep } from "vscode-azureextensionui";
import { webProvider } from "../../constants";
import { ext } from "../../extensionVariables";
import { ContainerAppTreeItem } from "../../tree/ContainerAppTreeItem";
import { createContainerAppsAPIClient } from "../../utils/azureClients";
import { localize } from "../../utils/localize";
import { nonNullValue } from "../../utils/nonNull";
import { getLoginServer } from "../createContainerApp/getLoginServer";
import { listCredentialsFromRegistry } from "./acr/listCredentialsFromRegistry";
import { ContainerRegistryListStep } from "./ContainerRegistryListStep";
import { IDeployImageContext } from "./IDeployImageContext";

export async function deployImage(context: IActionContext & Partial<IDeployImageContext>, node?: ContainerAppTreeItem): Promise<void> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<ContainerAppTreeItem>(ContainerAppTreeItem.contextValue, context);
    }

    const wizardContext: IDeployImageContext = { ...context, ...node.subscription, targetContainer: node.data };

    const title: string = localize('deployImage', 'Deploy image to "{0}"', node.name);
    const promptSteps: AzureWizardPromptStep<IDeployImageContext>[] =
        [new ContainerRegistryListStep()];
    const executeSteps: AzureWizardExecuteStep<IDeployImageContext>[] = [new VerifyProvidersStep([webProvider])];

    const wizard: AzureWizard<IDeployImageContext> = new AzureWizard(wizardContext, {
        title,
        promptSteps,
        executeSteps,
        showLoadingPrompt: true
    });

    await wizard.prompt();
    await wizard.execute();

    const containerAppEnvelope = await node.getContainerEnvelopeWithSecrets(context);

    // if this loginServer doesn't exist, then we need to add new credentials
    if (context.registry) {
        const registry = context.registry;
        if (!containerAppEnvelope.configuration.registries?.some(r => r.server === registry.loginServer)) {
            const { username, password } = await listCredentialsFromRegistry(wizardContext, registry);
            containerAppEnvelope.configuration?.registries?.push(
                {
                    server: registry.loginServer,
                    username: username,
                    passwordSecretRef: password.name
                }
            )
            containerAppEnvelope.configuration?.secrets?.push({ name: password.name, value: password.value });
        }
    }
    containerAppEnvelope.template.containers ||= [];
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
