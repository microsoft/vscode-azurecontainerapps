/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Secret, WebSiteManagementClient } from "@azure/arm-appservice";
import { AzExtRequestPrepareOptions, AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, IActionContext, sendRequestWithTimeout, VerifyProvidersStep } from "vscode-azureextensionui";
import { webProvider } from "../../constants";
import { ext } from "../../extensionVariables";
import { ContainerAppTreeItem } from "../../tree/ContainerAppTreeItem";
import { createWebSiteClient } from "../../utils/azureClients";
import { localize } from "../../utils/localize";
import { nonNullProp } from "../../utils/nonNull";
import { ContainerRegistryListStep } from "./ContainerRegistryListStep";
import { IDeployImageContext } from "./IDeployImageContext";
import { listCredentialsFromRegistry } from "./listCredentialsFromRegistry";
import { RegistryEnableAdminUserStep } from "./RegistryEnableAdminUserStep";
import { RegistryRepositoriesListStep } from "./RegistryRepositoriesListStep";
import { RepositoryTagListStep } from "./RepositoryTagListStep";

export async function deployImage(context: IActionContext & Partial<IDeployImageContext>, node?: ContainerAppTreeItem): Promise<void> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<ContainerAppTreeItem>(ContainerAppTreeItem.contextValue, context);
    }

    const wizardContext: IDeployImageContext = { ...context, ...node.subscription, targetContainer: node.data };

    const title: string = localize('deployImage', 'Deploy image to "{0}"', node.name);
    const promptSteps: AzureWizardPromptStep<IDeployImageContext>[] =
        [new ContainerRegistryListStep(), new RegistryEnableAdminUserStep(),
        new RegistryRepositoriesListStep(), new RepositoryTagListStep()];
    const executeSteps: AzureWizardExecuteStep<IDeployImageContext>[] = [new VerifyProvidersStep([webProvider])];

    const wizard: AzureWizard<IDeployImageContext> = new AzureWizard(wizardContext, {
        title,
        promptSteps,
        executeSteps,
        showLoadingPrompt: true
    });

    await wizard.prompt();
    await wizard.execute();

    // TODO: Extract this to its own step?
    // make a copy, we don't want to modify the one that is cached
    const containerAppEnvelope = { ...node.data };

    const options: AzExtRequestPrepareOptions = {
        method: 'POST',
        queryParameters: { 'api-version': '2021-03-01' },
        pathTemplate: `${node.id}/listSecrets`,
    };

    containerAppEnvelope.configuration ||= {};

    const response = await sendRequestWithTimeout(wizardContext, options, 5000, wizardContext.credentials);
    // if 204, needs to be an empty []
    containerAppEnvelope.configuration.secrets = response.status === 204 ? [] : <Secret[]>response.parsedBody;

    containerAppEnvelope.configuration.registries ||= [];
    // if this loginServer doesn't exist, then we need to add new credentials
    const registry = nonNullProp(wizardContext, 'registry');
    if (!containerAppEnvelope.configuration.registries.some(r => r.server === registry.loginServer)) {
        const { username, password } = await listCredentialsFromRegistry(wizardContext, registry);
        containerAppEnvelope.configuration?.registries.push(
            {
                server: registry.loginServer,
                username: username,
                passwordSecretRef: password.name
            }
        )
        containerAppEnvelope.configuration.secrets.push({ name: password.name, value: password.value });
    }

    if (containerAppEnvelope.template?.containers) {
        // can't have duplicate container names, but will worry about that later
        // don't have any ideas what name restrictions are here either
        containerAppEnvelope.template.containers.push(
            { image: `${registry.loginServer}/${wizardContext.repositoryName}:${wizardContext.tag}`, name: wizardContext.repositoryName }
        )
    }

    const webClient: WebSiteManagementClient = await createWebSiteClient([wizardContext, node]);
    node.data = await webClient.containerApps.beginCreateOrUpdateAndWait(node.resourceGroupName, node.name, containerAppEnvelope);
    await node.refresh(context);
}
