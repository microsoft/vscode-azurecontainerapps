/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type AuthorizationManagementClient, type RoleAssignment, type RoleAssignmentCreateParameters } from "@azure/arm-authorization";
import { uiUtils } from "@microsoft/vscode-azext-azureutils";
import { GenericParentTreeItem, GenericTreeItem, activityFailContext, activityFailIcon, activitySuccessContext, activitySuccessIcon, nonNullValueAndProp } from "@microsoft/vscode-azext-utils";
import * as crypto from "crypto";
import { type Progress } from "vscode";
import { createActivityChildContext } from "../../../../utils/activity/activityUtils";
import { ExecuteActivityOutputStepBase, type ExecuteActivityOutput } from "../../../../utils/activity/ExecuteActivityOutputStepBase";
import { createAuthorizationManagementClient } from "../../../../utils/azureClients";
import { localize } from "../../../../utils/localize";
import { type ContainerRegistryImageSourceContext } from "./ContainerRegistryImageSourceContext";

const acrPullRoleId: string = '7f951dda-4ed3-4680-a7ca-43fe172d538d';

export class ContainerRegistryEnableAcrPullStep extends ExecuteActivityOutputStepBase<ContainerRegistryImageSourceContext> {
    public priority: number = 490; // Todo: Verify priority

    protected async executeCore(context: ContainerRegistryImageSourceContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const registryId: string = nonNullValueAndProp(context.registry, 'id');
        const containerAppIdentity: string = nonNullValueAndProp(context.containerApp?.identity, 'principalId');
        progress.report({ message: localize('verifyingRegistryPermissions', 'Verifying registry permissions...') });

        const client: AuthorizationManagementClient = await createAuthorizationManagementClient(context);
        if (await this.doesAcrPullAssignmentExist(client, registryId, containerAppIdentity)) {
            return;
        }

        const roleCreateParams: RoleAssignmentCreateParameters = {
            description: 'acr pull',
            roleDefinitionId: `/providers/Microsoft.Authorization/roleDefinitions/${acrPullRoleId}`,
            principalId: containerAppIdentity,
        };

        await client.roleAssignments.create(
            registryId,
            crypto.randomUUID(),
            roleCreateParams,
        );
    }

    private async doesAcrPullAssignmentExist(client: AuthorizationManagementClient, registryId: string, containerAppIdentity: string): Promise<boolean> {
        const roleAssignments: RoleAssignment[] = await uiUtils.listAllIterator(client.roleAssignments.listForScope(
            registryId,
            {
                // $filter=principalId eq {id}
                filter: `principalId eq '{${containerAppIdentity}}'`,
            }
        ));
        return roleAssignments.some(r => !!r.roleDefinitionId?.endsWith(acrPullRoleId));
    }

    public shouldExecute(context: ContainerRegistryImageSourceContext): boolean {
        return !!context.registry && !!context.containerApp?.identity?.principalId;
    }

    protected createSuccessOutput(context: ContainerRegistryImageSourceContext): ExecuteActivityOutput {
        return {
            item: new GenericTreeItem(undefined, {
                contextValue: createActivityChildContext(['containerRegistryEnableAcrPullStepSuccessItem', activitySuccessContext]),
                label: localize('verifyAcrPull', 'Verify "{0}" permissions on container registry "{1}"', 'acrPull', context.registry?.name),
                iconPath: activitySuccessIcon
            }),
            message: localize('verifyAcrPullSuccess', 'Successfully verified "{0}" permissions on container registry "{1}" for container app "{2}"', 'acrPull', context.registry?.name, context.containerApp?.name)
        };
    }

    protected createFailOutput(context: ContainerRegistryImageSourceContext): ExecuteActivityOutput {
        return {
            item: new GenericParentTreeItem(undefined, {
                contextValue: createActivityChildContext(['containerRegistryEnableAcrPullFailItem', activityFailContext]),
                label: localize('verifyAcrPull', 'Verify "{0}" permissions on container registry "{1}"', 'acrPull', context.registry?.name),
                iconPath: activityFailIcon
            }),
            message: localize('verifyAcrPullFail', 'Could not verify "{0}" permissions on container registry "{1}" for container app "{2}"', 'acrPull', context.registry?.name, context.containerApp?.name)
        };
    }
}
