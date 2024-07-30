/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type AuthorizationManagementClient, type RoleAssignmentCreateParameters } from "@azure/arm-authorization";
import { GenericParentTreeItem, GenericTreeItem, activityFailContext, activityFailIcon, activitySuccessContext, activitySuccessIcon, nonNullValueAndProp } from "@microsoft/vscode-azext-utils";
import * as crypto from "crypto";
import { type Progress } from "vscode";
import { createActivityChildContext } from "../../../../utils/activity/activityUtils";
import { ExecuteActivityOutputStepBase, type ExecuteActivityOutput } from "../../../../utils/activity/ExecuteActivityOutputStepBase";
import { createAuthorizationManagementClient } from "../../../../utils/azureClients";
import { localize } from "../../../../utils/localize";
import { type RegistryCredentialsContext } from "../RegistryCredentialsContext";

const acrPullRoleId: string = '7f951dda-4ed3-4680-a7ca-43fe172d538d';

export class ContainerRegistryAcrPullEnableStep extends ExecuteActivityOutputStepBase<RegistryCredentialsContext> {
    public priority: number = 370; // Todo: Verify priority

    protected async executeCore(context: RegistryCredentialsContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        // Add check to see if the role already exists

        const client: AuthorizationManagementClient = await createAuthorizationManagementClient(context);
        const roleCreateParams: RoleAssignmentCreateParameters = {
            description: 'acr pull',
            roleDefinitionId: `/providers/Microsoft.Authorization/roleDefinitions/${acrPullRoleId}`,
            principalId: nonNullValueAndProp(context.managedEnvironment?.identity, 'principalId'),
        };

        progress.report({ message: localize('updatingRegistryCredentials', 'Updating registry credentials...') })
        context.registryRoleAssignment = await client.roleAssignments.create(
            nonNullValueAndProp(context.registry, 'id'),
            crypto.randomUUID(),
            roleCreateParams,
        );
    }

    public shouldExecute(context: RegistryCredentialsContext): boolean {
        return !!context.registry && !!context.managedEnvironment?.identity?.principalId;
    }

    protected createSuccessOutput(context: RegistryCredentialsContext): ExecuteActivityOutput {
        return {
            item: new GenericTreeItem(undefined, {
                contextValue: createActivityChildContext(['containerRegistryAcrPullEnableStepSuccessItem', activitySuccessContext]),
                label: localize('enableAcrPull', 'Grant "{0}" access to container environment "{1}" from registry "{2}"', 'acrPull', context.registry?.name, context.managedEnvironment?.name),
                iconPath: activitySuccessIcon
            }),
            message: localize('enableAcrPullSuccess', 'Successfully granted "{0}" access to container environment "{1}" from registry "{2}".', 'acrPull', context.registry?.name, context.managedEnvironment?.name),
        };
    }

    protected createFailOutput(context: RegistryCredentialsContext): ExecuteActivityOutput {
        return {
            item: new GenericParentTreeItem(undefined, {
                contextValue: createActivityChildContext(['containerRegistryAcrPullEnableStepFailItem', activityFailContext]),
                label: localize('enableAcrPull', 'Grant "{0}" access to container environment "{1}" from registry "{2}"', 'acrPull', context.registry?.name, context.managedEnvironment?.name),
                iconPath: activityFailIcon
            }),
            message: localize('enableAcrPullFail', 'Failed to grant "{0}" access to container environment "{1}" from registry "{2}".', 'acrPull', context.registry?.name, context.managedEnvironment?.name),
        };
    }
}
