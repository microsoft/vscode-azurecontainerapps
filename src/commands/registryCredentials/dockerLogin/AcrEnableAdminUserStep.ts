/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ContainerRegistryManagementClient } from "@azure/arm-containerregistry";
import { getResourceGroupFromId } from "@microsoft/vscode-azext-azureutils";
import { activityFailIcon, activitySuccessContext, activitySuccessIcon, GenericParentTreeItem, GenericTreeItem, nonNullProp, nonNullValue } from "@microsoft/vscode-azext-utils";
import { createActivityChildContext } from "../../../utils/activity/activityUtils";
import { ExecuteActivityOutputStepBase, type ExecuteActivityOutput } from "../../../utils/activity/ExecuteActivityOutputStepBase";
import { createContainerRegistryManagementClient } from "../../../utils/azureClients";
import { localize } from "../../../utils/localize";
import { type DockerLoginRegistryCredentialsContext } from "./DockerLoginRegistryCredentialsContext";

export class AcrEnableAdminUserStep extends ExecuteActivityOutputStepBase<DockerLoginRegistryCredentialsContext> {
    public priority: number = 450;

    public async executeCore(context: DockerLoginRegistryCredentialsContext): Promise<void> {
        const registry = nonNullValue(context.registry);
        registry.adminUserEnabled = true;

        const client: ContainerRegistryManagementClient = await createContainerRegistryManagementClient(context);
        context.registry = await client.registries.beginUpdateAndWait(getResourceGroupFromId(nonNullProp(registry, 'id')), nonNullProp(registry, 'name'), registry);

        if (!context.registry?.adminUserEnabled) {
            throw new Error(localize('failedToUpdate', 'Failed to enable admin user for registry "{0}". Go to the portal to manually update.', context.registry?.name));
        }
    }

    public shouldExecute(context: DockerLoginRegistryCredentialsContext): boolean {
        return !!context.registry && !context.registry.adminUserEnabled;
    }

    protected createSuccessOutput(context: DockerLoginRegistryCredentialsContext): ExecuteActivityOutput {
        return {
            item: new GenericTreeItem(undefined, {
                contextValue: createActivityChildContext(['acrEnableAdminUserStepSuccessItem', activitySuccessContext]),
                label: localize('enableAdminUser', 'Enable admin user setting for container registry "{0}"', context.registry?.name),
                iconPath: activitySuccessIcon
            }),
            message: localize('enableAdminUserSuccess', 'Successfully enabled admin user setting for container registry "{0}".', context.registry?.name)
        };
    }

    protected createFailOutput(context: DockerLoginRegistryCredentialsContext): ExecuteActivityOutput {
        return {
            item: new GenericParentTreeItem(undefined, {
                contextValue: createActivityChildContext(['acrEnableAdminUserStepFailItem', activitySuccessContext]),
                label: localize('enableAdminUser', 'Enable admin user setting for container registry "{0}"', context.registry?.name),
                iconPath: activityFailIcon
            }),
            message: localize('enableAdminUserFail', 'Failed to enable admin user setting for container registry "{0}".', context.registry?.name)
        };
    }
}