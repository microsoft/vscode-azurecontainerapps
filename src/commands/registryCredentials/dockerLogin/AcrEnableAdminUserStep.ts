/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ContainerRegistryManagementClient } from "@azure/arm-containerregistry";
import { getResourceGroupFromId } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardExecuteStepWithActivityOutput, nonNullProp, nonNullValue } from "@microsoft/vscode-azext-utils";
import { createContainerRegistryManagementClient } from "../../../utils/azureClients";
import { localize } from "../../../utils/localize";
import { type DockerLoginRegistryCredentialsContext } from "./DockerLoginRegistryCredentialsContext";

export class AcrEnableAdminUserStep<T extends DockerLoginRegistryCredentialsContext> extends AzureWizardExecuteStepWithActivityOutput<T> {
    public priority: number = 450;
    public stepName: string = 'acrEnableAdminUserStep';
    protected getOutputLogSuccess = (context: T) => localize('enableAdminUserSuccess', 'Successfully enabled admin user setting for container registry "{0}".', context.registry?.name);
    protected getOutputLogFail = (context: T) => localize('enableAdminUserFail', 'Failed to enable admin user setting for container registry "{0}".', context.registry?.name);
    protected getTreeItemLabel = (context: T) => localize('enableAdminUser', 'Enable admin user setting for container registry "{0}"', context.registry?.name);

    public async execute(context: T): Promise<void> {
        const registry = nonNullValue(context.registry);
        registry.adminUserEnabled = true;

        const client: ContainerRegistryManagementClient = await createContainerRegistryManagementClient(context);
        context.registry = await client.registries.beginUpdateAndWait(getResourceGroupFromId(nonNullProp(registry, 'id')), nonNullProp(registry, 'name'), registry);

        if (!context.registry?.adminUserEnabled) {
            throw new Error(localize('failedToUpdate', 'Failed to enable admin user for registry "{0}". Go to the portal to manually update.', context.registry?.name));
        }
    }

    public shouldExecute(context: T): boolean {
        return !!context.registry && !context.registry.adminUserEnabled;
    }
}
