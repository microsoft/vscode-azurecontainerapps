/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type AuthorizationManagementClient, type RoleAssignment } from "@azure/arm-authorization";
import { uiUtils } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardExecuteStep, GenericParentTreeItem, GenericTreeItem, activityFailContext, activityFailIcon, activitySuccessContext, activitySuccessIcon, createUniversallyUniqueContextValue, nonNullValueAndProp, type ExecuteActivityOutput } from "@microsoft/vscode-azext-utils";
import { type Progress } from "vscode";
import { createAuthorizationManagementClient } from "../../../utils/azureClients";
import { localize } from "../../../utils/localize";
import { type ManagedIdentityRegistryCredentialsContext } from "./ManagedIdentityRegistryCredentialsContext";

export const acrPullRoleId: string = '7f951dda-4ed3-4680-a7ca-43fe172d538d';

export class AcrPullVerifyStep extends AzureWizardExecuteStep<ManagedIdentityRegistryCredentialsContext> {
    public priority: number = 460;

    public async execute(context: ManagedIdentityRegistryCredentialsContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const client: AuthorizationManagementClient = await createAuthorizationManagementClient(context);
        const registryId: string = nonNullValueAndProp(context.registry, 'id');
        const managedEnvironmentIdentity: string = nonNullValueAndProp(context.managedEnvironment?.identity, 'principalId');

        progress.report({ message: localize('verifyingAcrPull', 'Verifying ACR pull role...') })
        const roleAssignments: RoleAssignment[] = await uiUtils.listAllIterator(client.roleAssignments.listForScope(
            registryId,
            {
                // $filter=principalId eq {id}
                filter: `principalId eq '{${managedEnvironmentIdentity}}'`,
            }
        ));

        context.hasAcrPullRole = roleAssignments.some(r => !!r.roleDefinitionId?.endsWith(acrPullRoleId));
    }

    public shouldExecute(context: ManagedIdentityRegistryCredentialsContext): boolean {
        return !!context.registry;
    }

    public createSuccessOutput(context: ManagedIdentityRegistryCredentialsContext): ExecuteActivityOutput {
        if (context.hasAcrPullRole) {
            return {
                item: new GenericTreeItem(undefined, {
                    contextValue: createUniversallyUniqueContextValue(['containerRegistryAcrPullVerifyStepSuccessItem', activitySuccessContext]),
                    label: localize('verifyAcrPull', 'Verify "{0}" access on container registry "{1}"', 'acrPull', context.registry?.name),
                    iconPath: activitySuccessIcon
                }),
                message: localize('verifyAcrPullSuccess', 'Successfully verified "{0}" access on container registry "{1}".', 'acrPull', context.registry?.name),
            };
        } else {
            // 'AcrPullEnableStep' will cover showing this output
            return {};
        }
    }

    public createFailOutput(context: ManagedIdentityRegistryCredentialsContext): ExecuteActivityOutput {
        return {
            item: new GenericParentTreeItem(undefined, {
                contextValue: createUniversallyUniqueContextValue(['containerRegistryAcrPullVerifyStepFailItem', activityFailContext]),
                label: localize('verifyAcrPull', 'Verify "{0}" access on container registry "{1}"', 'acrPull', context.registry?.name),
                iconPath: activityFailIcon
            }),
            message: localize('verifyAcrPullFail', 'Failed to verify "{0}" access on container registry "{1}".', 'acrPull', context.registry?.name),
        };
    }
}
