/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownPrincipalType, type AuthorizationManagementClient, type RoleAssignment, type RoleAssignmentCreateParameters } from "@azure/arm-authorization";
import { uiUtils, type AzExtClientContext } from "@microsoft/vscode-azext-azureutils";
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

    protected getOutputLogSuccess = (context: T) => localize('grantRegistryIdentityRoleSuccess', 'Granted AcrPull on registry "{0}" to identity "{1}".', context.registry?.name, context.managedIdentity?.name);
    protected getOutputLogFail = (context: T) => localize('grantRegistryIdentityRoleFail', 'Failed to grant AcrPull on registry "{0}" to identity "{1}".', context.registry?.name, context.managedIdentity?.name);
    protected getTreeItemLabel = (context: T) => localize('grantRegistryIdentityRole', 'Grant AcrPull on registry "{0}" to identity "{1}"', context.registry?.name, context.managedIdentity?.name);
    private hasAcrPullRole: boolean;

    public async configureBeforeExecute(context: T): Promise<void> {
        this.hasAcrPullRole = await AcrPullEnableStep.hasRole(context, context.registry?.id, nonNullValueAndProp(context.managedIdentity, 'principalId'));
        if (this.hasAcrPullRole) {
            ext.outputChannel.appendLog(localize('verifyAcrPullSuccess', 'Successfully verified "{0}" access on container registry "{1}".', 'acrPull', context.registry?.name));
        }
    }

    public async execute(context: T, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const client: AuthorizationManagementClient = await createAuthorizationManagementClient(context);
        const roleCreateParams: RoleAssignmentCreateParameters = {
            description: 'acr pull',
            roleDefinitionId: `/providers/Microsoft.Authorization/roleDefinitions/${acrPullRoleId}`,
            principalId: nonNullValueAndProp(context.managedIdentity, 'principalId'),
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

    public static async hasRole(context: AzExtClientContext, registryId: string | undefined, principalId: string): Promise<boolean> {
        const principalIds = await AcrPullEnableStep.getPrincipalIdsWithRole(context, registryId);
        return principalIds.has(principalId.toLowerCase());
    }

    public static async getPrincipalIdsWithRole(context: AzExtClientContext, registryId: string | undefined): Promise<Set<string>> {
        if (!registryId) {
            return new Set<string>();
        }

        const client: AuthorizationManagementClient = await createAuthorizationManagementClient(context);
        const roleAssignments: RoleAssignment[] = await uiUtils.listAllIterator(client.roleAssignments.listForScope(
            registryId.toLowerCase(),
            { filter: 'atScope()' },
        ));
        return new Set(roleAssignments
            .filter(assignment => assignment.principalId && assignment.roleDefinitionId?.toLowerCase().endsWith(`/${acrPullRoleId}`))
            .map(assignment => nonNullValueAndProp(assignment, 'principalId').toLowerCase()));
    }
}
