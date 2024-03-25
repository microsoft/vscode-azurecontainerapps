/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ContainerAppsAPIClient, type ManagedEnvironment } from "@azure/arm-appcontainers";
import { type ResourceGroup } from "@azure/arm-resources";
import { ResourceGroupListStep, getResourceGroupFromId, parseAzureResourceId, uiUtils } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardPromptStep, nonNullProp, nonNullValueAndProp, type IAzureQuickPickItem } from "@microsoft/vscode-azext-utils";
import { createContainerAppsAPIClient } from "../../../../utils/azureClients";
import { localize } from "../../../../utils/localize";
import { type DeployWorkspaceProjectInternalContext } from "../deployWorkspaceProjectInternal";

export class DwpManagedEnvironmentListStep extends AzureWizardPromptStep<DeployWorkspaceProjectInternalContext> {
    public async prompt(context: DeployWorkspaceProjectInternalContext): Promise<void> {
        const placeHolder: string = localize('selectManagedEnvironment', 'Select a container apps environment');
        const picks: IAzureQuickPickItem<ManagedEnvironment | undefined>[] = await this.getPicks(context);

        if (!picks.length) {
            // No managed environments to choose from
            return;
        }


        const managedEnvironment: ManagedEnvironment | undefined = (await context.ui.showQuickPick(picks, { placeHolder })).data;
        if (!managedEnvironment) {
            // User is choosing to create a new managed environment
            return;
        }

        await this.setContextWithManagedEnvironmentResources(context, managedEnvironment);
    }

    public shouldPrompt(context: DeployWorkspaceProjectInternalContext): boolean {
        return !context.managedEnvironment;
    }

    private async getPicks(context: DeployWorkspaceProjectInternalContext): Promise<IAzureQuickPickItem<ManagedEnvironment | undefined>[]> {
        const client: ContainerAppsAPIClient = await createContainerAppsAPIClient(context);
        const managedEnvironments: ManagedEnvironment[] = await uiUtils.listAllIterator(
            context.resourceGroup ?
                client.managedEnvironments.listByResourceGroup(nonNullValueAndProp(context.resourceGroup, 'name')) :
                client.managedEnvironments.listBySubscription()
        );

        if (!managedEnvironments.length) {
            return [];
        }

        return [
            {
                label: localize('newManagedEnvironment', '$(plus) Create new container apps environment'),
                description: '',
                data: undefined
            },
            ...managedEnvironments.map(env => {
                const environmentName: string = nonNullProp(env, 'name');
                const resourceGroupName: string = parseAzureResourceId(nonNullProp(env, 'id')).resourceGroup;

                return {
                    label: environmentName,
                    description: environmentName === resourceGroupName ? undefined : resourceGroupName,
                    data: env
                };
            })
        ];
    }

    private async setContextWithManagedEnvironmentResources(context: DeployWorkspaceProjectInternalContext, managedEnvironment: ManagedEnvironment): Promise<void> {
        const resourceGroups: ResourceGroup[] = await ResourceGroupListStep.getResourceGroups(context);
        context.resourceGroup = resourceGroups.find(rg => rg.name === getResourceGroupFromId(nonNullProp(managedEnvironment, 'id')));
        context.managedEnvironment = managedEnvironment;
    }
}
