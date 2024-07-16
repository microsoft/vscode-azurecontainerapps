/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type RegistryCredentials } from "@azure/arm-appcontainers";
import { type AuthorizationManagementClient, type RoleAssignmentCreateParameters } from "@azure/arm-authorization";
import { GenericParentTreeItem, GenericTreeItem, activityFailContext, activityFailIcon, activitySuccessContext, activitySuccessIcon, nonNullValueAndProp } from "@microsoft/vscode-azext-utils";
import * as crypto from "crypto";
import { type Progress } from "vscode";
import { createActivityChildContext } from "../../../utils/activity/activityUtils";
import { ExecuteActivityOutputStepBase, type ExecuteActivityOutput } from "../../../utils/activity/ExecuteActivityOutputStepBase";
import { createAuthorizationManagementClient } from "../../../utils/azureClients";
import { localize } from "../../../utils/localize";
import { type ContainerRegistryIdentityConnectionContext } from "./ContainerRegistryIdentityConnectionContext";

const acrPullRoleId: string = 'f951dda-4ed3-4680-a7ca-43fe172d538d';

export class ContainerRegistryEnableAcrPullStep extends ExecuteActivityOutputStepBase<ContainerRegistryIdentityConnectionContext> {
    public priority: number = 640; // Todo: Verify priority

    protected async executeCore(context: ContainerRegistryIdentityConnectionContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const client: AuthorizationManagementClient = await createAuthorizationManagementClient(context);
        const roleCreateParams: RoleAssignmentCreateParameters = {
            description: 'acr pull',
            roleDefinitionId: `/providers/Microsoft.Authorization/roleDefinitions/${acrPullRoleId}`,
            principalId: nonNullValueAndProp(context.containerApp?.identity, 'principalId'),
        };

        progress.report({ message: localize('configuringRegistryRbac', 'Configuring registry RBAC...') })
        context.registryRoleAssignment = await client.roleAssignments.create(
            nonNullValueAndProp(context.registry, 'id'),
            crypto.randomUUID(),
            roleCreateParams,
        );

        progress.report({ message: localize('updatingRegistryCredentials', 'Updating registry credentials...') })
        const newRegistryConfiguration: RegistryCredentials = {
            server: nonNullValueAndProp(context.registry, 'loginServer'),
            username: "",
            passwordSecretRef: "",
            identity: "system",
        };

        const existingRegistryIndex: number = context.containerApp?.configuration?.registries?.findIndex(r => r.server && r.server === context.registry?.loginServer) ?? -1;
        if (existingRegistryIndex === -1) {
            // Push
        } else {
            // Replace
        }
    }

    public shouldExecute(context: ContainerRegistryIdentityConnectionContext): boolean {
        return !!context.registry && !!context.containerApp?.identity?.principalId;
    }

    protected createSuccessOutput(context: ContainerRegistryIdentityConnectionContext): ExecuteActivityOutput {
        return {
            item: new GenericTreeItem(undefined, {
                contextValue: createActivityChildContext(['containerRegistryEnableAcrPullStepSuccessItem', activitySuccessContext]),
                label: localize('enableAcrPull', 'Enable "{0}" on container registry "{1}" for container app "{2}"', 'acrPull', context.registry?.name, context.containerApp?.name),
                iconPath: activitySuccessIcon
            }),
            message: localize('enableAcrPullSuccess', 'Successfully enabled "{0}" on container registry "{1}" for container app "{2}"', 'acrPull', context.registry?.name, context.containerApp?.name)
        };
    }

    protected createFailOutput(context: ContainerRegistryIdentityConnectionContext): ExecuteActivityOutput {
        return {
            item: new GenericParentTreeItem(undefined, {
                contextValue: createActivityChildContext(['containerRegistryEnableAcrPullFailItem', activityFailContext]),
                label: localize('enableAcrPull', 'Enable "{0}" on container registry "{1}" for container app "{2}"', 'acrPull', context.registry?.name, context.containerApp?.name),
                iconPath: activityFailIcon
            }),
            message: localize('enableAcrPullFail', 'Failed to enable "{0}" on container registry "{1}" for container app "{2}"', 'acrPull', context.registry?.name, context.containerApp?.name)
        };
    }
}
