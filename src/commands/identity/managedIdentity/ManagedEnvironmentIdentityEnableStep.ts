/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownManagedServiceIdentityType, type ContainerAppsAPIClient, type ManagedEnvironment } from "@azure/arm-appcontainers";
import { parseAzureResourceId, type ParsedAzureResourceId } from "@microsoft/vscode-azext-azureutils";
import { activityFailIcon, activitySuccessContext, activitySuccessIcon, GenericParentTreeItem, GenericTreeItem, nonNullProp } from "@microsoft/vscode-azext-utils";
import { type Progress } from "vscode";
import { createActivityChildContext } from "../../../utils/activity/activityUtils";
import { ExecuteActivityOutputStepBase, type ExecuteActivityOutput } from "../../../utils/activity/ExecuteActivityOutputStepBase";
import { createContainerAppsAPIClient } from "../../../utils/azureClients";
import { localize } from "../../../utils/localize";
import { type ManagedEnvironmentContext } from "../../ManagedEnvironmentContext";

export class ManagedEnvironmentIdentityEnableStep extends ExecuteActivityOutputStepBase<ManagedEnvironmentContext> {
    public priority: number = 350; // Todo: Verify the priority level is okay

    protected async executeCore(context: ManagedEnvironmentContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const client: ContainerAppsAPIClient = await createContainerAppsAPIClient(context);
        const managedEnvironment: ManagedEnvironment = nonNullProp(context, 'managedEnvironment');
        const parsedResourceId: ParsedAzureResourceId = parseAzureResourceId(nonNullProp(managedEnvironment, 'id'));

        progress.report({ message: localize('enablingIdentity', 'Enabling managed identity...') })
        context.managedEnvironment = await client.managedEnvironments.beginUpdateAndWait(parsedResourceId.resourceGroup, parsedResourceId.resourceName,
            {
                location: managedEnvironment.location,
                identity: {
                    type: KnownManagedServiceIdentityType.SystemAssigned,
                },
            }
        );
    }

    public shouldExecute(context: ManagedEnvironmentContext): boolean {
        return !!context.managedEnvironment && !context.managedEnvironment.identity?.principalId;
    }

    protected createSuccessOutput(context: ManagedEnvironmentContext): ExecuteActivityOutput {
        return {
            item: new GenericTreeItem(undefined, {
                contextValue: createActivityChildContext(['managedEnvironmentIdentityEnableStepSuccessItem', activitySuccessContext]),
                label: localize('enableIdentity', 'Enable system-assigned identity for environment "{0}"', context.managedEnvironment?.name),
                iconPath: activitySuccessIcon
            }),
            message: localize('enableIdentitySuccess', 'Enabled system-assigned identity for environment "{0}"', context.managedEnvironment?.name)
        };
    }

    protected createFailOutput(context: ManagedEnvironmentContext): ExecuteActivityOutput {
        return {
            item: new GenericParentTreeItem(undefined, {
                contextValue: createActivityChildContext(['managedEnvironmentIdentityEnableStepFailItem', activitySuccessContext]),
                label: localize('enableIdentity', 'Enable system-assigned identity for environment "{0}"', context.managedEnvironment?.name),
                iconPath: activityFailIcon
            }),
            message: localize('enableIdentityFail', 'Failed to enable system-assigned identity for environment "{0}"', context.managedEnvironment?.name)
        };
    }
}
