/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownPrincipalType, type AuthorizationManagementClient, type RoleAssignment, type RoleAssignmentCreateParameters } from "@azure/arm-authorization";
import { uiUtils } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardExecuteStepWithActivityOutput, nonNullValueAndProp } from "@microsoft/vscode-azext-utils";
import * as crypto from "crypto";
import { type Progress } from "vscode";
import { ext } from "../../../extensionVariables";
import { createAuthorizationManagementClient } from "../../../utils/azureClients";
import { localize } from "../../../utils/localize";
import { type ManagedIdentityRegistryCredentialsContext } from "./ManagedIdentityRegistryCredentialsContext";

const acrPullRoleId: string = '7f951dda-4ed3-4680-a7ca-43fe172d538d';

export class AcrPullEnableStep<T extends ManagedIdentityRegistryCredentialsContext> extends AzureWizardExecuteStepWithActivityOutput<T> {
    public priority: number = 460;
    public stepName: string = 'acrPullEnableStep';

    protected getOutputLogSuccess = () => localize('enableAcrPullSuccess', 'Successfully granted "{0}" access to container environment identity.', 'acrPull');
    protected getOutputLogFail = () => localize('enableAcrPullFail', 'Failed to grant "{0}" access to container environment identity.', 'acrPull');
    protected getTreeItemLabel = () => localize('enableAcrPull', 'Grant "{0}" access to container environment identity', 'acrPull');
    private hasAcrPullRole: boolean;

    // Check for AcrPullRole
    public async configureBeforeExecute(context: T): Promise<void> {
        const client: AuthorizationManagementClient = await createAuthorizationManagementClient(context);
        const registryId: string = nonNullValueAndProp(context.registry, 'id');
        const managedEnvironmentIdentity: string = nonNullValueAndProp(context.managedEnvironment?.identity, 'principalId');

        const roleAssignments: RoleAssignment[] = await uiUtils.listAllIterator(client.roleAssignments.listForScope(
            registryId,
            {
                // $filter=principalId eq {id}
                filter: `principalId eq '{${managedEnvironmentIdentity}}'`,
            }
        ));

        this.hasAcrPullRole = roleAssignments.some(r => !!r.roleDefinitionId?.endsWith(acrPullRoleId));
        if (this.hasAcrPullRole) {
            ext.outputChannel.appendLog(localize('verifyAcrPullSuccess', 'Successfully verified "{0}" access on container registry "{1}".', 'acrPull', context.registry?.name));
        }
    }

    public async execute(context: T, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const client: AuthorizationManagementClient = await createAuthorizationManagementClient(context);
        const roleCreateParams: RoleAssignmentCreateParameters = {
            description: 'acr pull',
            roleDefinitionId: `/providers/Microsoft.Authorization/roleDefinitions/${acrPullRoleId}`,
            principalId: nonNullValueAndProp(context.managedEnvironment?.identity, 'principalId'),
            principalType: KnownPrincipalType.ServicePrincipal,
        };

        progress.report({ message: localize('addingAcrPull', 'Adding ACR pull role...') });
        await client.roleAssignments.create(
            nonNullValueAndProp(context.registry, 'id'),
            crypto.randomUUID(),
            roleCreateParams,
        );
    }

    public shouldExecute(context: T): boolean {
        return !!context.registry && !this.hasAcrPullRole;
    }
}
