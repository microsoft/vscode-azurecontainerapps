/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownPrincipalType, type AuthorizationManagementClient, type RoleAssignment, type RoleAssignmentCreateParameters } from "@azure/arm-authorization";
import { uiUtils } from "@microsoft/vscode-azext-azureutils";
import { GenericParentTreeItem, GenericTreeItem, activityFailContext, activityFailIcon, activitySuccessContext, activitySuccessIcon, nonNullValueAndProp } from "@microsoft/vscode-azext-utils";
import * as crypto from "crypto";
import { type Progress } from "vscode";
import { createActivityChildContext } from "../../../utils/activity/activityUtils";
import { ExecuteActivityOutputStepBase, type ExecuteActivityOutput } from "../../../utils/activity/ExecuteActivityOutputStepBase";
import { createAuthorizationManagementClient } from "../../../utils/azureClients";
import { localize } from "../../../utils/localize";
import { type ManagedIdentityRegistryCredentialsContext } from "./ManagedIdentityRegistryCredentialsContext";

const acrPullRoleId: string = '7f951dda-4ed3-4680-a7ca-43fe172d538d';

export class AcrPullEnableStep extends ExecuteActivityOutputStepBase<ManagedIdentityRegistryCredentialsContext> {
    public priority: number = 460;

    // Add a configureBeforeExecute

    protected async executeCore(context: ManagedIdentityRegistryCredentialsContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const client: AuthorizationManagementClient = await createAuthorizationManagementClient(context);
        const registryId: string = nonNullValueAndProp(context.registry, 'id');
        const managedEnvironmentIdentity: string = nonNullValueAndProp(context.managedEnvironment?.identity, 'principalId');

        if (await this.hasAcrPullAssignment(client, registryId, managedEnvironmentIdentity)) {
            return;
        }

        const roleCreateParams: RoleAssignmentCreateParameters = {
            description: 'acr pull',
            roleDefinitionId: `/providers/Microsoft.Authorization/roleDefinitions/${acrPullRoleId}`,
            principalId: nonNullValueAndProp(context.managedEnvironment?.identity, 'principalId'),
            principalType: KnownPrincipalType.ServicePrincipal,
        };

        progress.report({ message: localize('updatingRegistryCredentials', 'Updating registry credentials...') });
        await client.roleAssignments.create(
            nonNullValueAndProp(context.registry, 'id'),
            crypto.randomUUID(),
            roleCreateParams,
        );
    }

    public shouldExecute(context: ManagedIdentityRegistryCredentialsContext): boolean {
        return !!context.registry;
    }

    private async hasAcrPullAssignment(client: AuthorizationManagementClient, registryId: string, managedEnvironmentIdentity: string): Promise<boolean> {
        const roleAssignments: RoleAssignment[] = await uiUtils.listAllIterator(client.roleAssignments.listForScope(
            registryId,
            {
                // $filter=principalId eq {id}
                filter: `principalId eq '{${managedEnvironmentIdentity}}'`,
            }
        ));
        return roleAssignments.some(r => !!r.roleDefinitionId?.endsWith(acrPullRoleId));
    }

    protected createSuccessOutput(): ExecuteActivityOutput {
        return {
            item: new GenericTreeItem(undefined, {
                contextValue: createActivityChildContext(['containerRegistryAcrPullEnableStepSuccessItem', activitySuccessContext]),
                label: localize('enableAcrPull', 'Grant "{0}" access to container environment identity', 'acrPull'),
                iconPath: activitySuccessIcon
            }),
            message: localize('enableAcrPullSuccess', 'Successfully granted "{0}" access to container environment identity.', 'acrPull'),
        };
    }

    protected createFailOutput(): ExecuteActivityOutput {
        return {
            item: new GenericParentTreeItem(undefined, {
                contextValue: createActivityChildContext(['containerRegistryAcrPullEnableStepFailItem', activityFailContext]),
                label: localize('enableAcrPull', 'Grant "{0}" access to container environment identity"', 'acrPull'),
                iconPath: activityFailIcon
            }),
            message: localize('enableAcrPullFail', 'Failed to grant "{0}" access to container environment identity.', 'acrPull'),
        };
    }
}
