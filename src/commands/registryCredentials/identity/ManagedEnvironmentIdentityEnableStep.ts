/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownManagedServiceIdentityType, type ContainerAppsAPIClient, type ManagedEnvironment } from "@azure/arm-appcontainers";
import { parseAzureResourceId, type ParsedAzureResourceId } from "@microsoft/vscode-azext-azureutils";
import { activityFailIcon, activitySuccessContext, activitySuccessIcon, AzureWizardExecuteStep, createUniversallyUniqueContextValue, GenericParentTreeItem, GenericTreeItem, nonNullProp, type ExecuteActivityOutput } from "@microsoft/vscode-azext-utils";
import { type Progress } from "vscode";
import { createContainerAppsAPIClient } from "../../../utils/azureClients";
import { localize } from "../../../utils/localize";
import { type ManagedIdentityRegistryCredentialsContext } from "./ManagedIdentityRegistryCredentialsContext";

export class ManagedEnvironmentIdentityEnableStep extends AzureWizardExecuteStep<ManagedIdentityRegistryCredentialsContext> {
    public priority: number = 450;

    public async execute(context: ManagedIdentityRegistryCredentialsContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
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

    public shouldExecute(context: ManagedIdentityRegistryCredentialsContext): boolean {
        return !!context.managedEnvironment && !context.managedEnvironment.identity?.principalId;
    }

    public createSuccessOutput(context: ManagedIdentityRegistryCredentialsContext): ExecuteActivityOutput {
        return {
            item: new GenericTreeItem(undefined, {
                contextValue: createUniversallyUniqueContextValue(['managedEnvironmentIdentityEnableStepSuccessItem', activitySuccessContext]),
                label: localize('enableIdentity', 'Enable system-assigned identity for environment "{0}"', context.managedEnvironment?.name),
                iconPath: activitySuccessIcon
            }),
            message: localize('enableIdentitySuccess', 'Enabled system-assigned identity for environment "{0}"', context.managedEnvironment?.name)
        };
    }

    public createFailOutput(context: ManagedIdentityRegistryCredentialsContext): ExecuteActivityOutput {
        return {
            item: new GenericParentTreeItem(undefined, {
                contextValue: createUniversallyUniqueContextValue(['managedEnvironmentIdentityEnableStepFailItem', activitySuccessContext]),
                label: localize('enableIdentity', 'Enable system-assigned identity for environment "{0}"', context.managedEnvironment?.name),
                iconPath: activityFailIcon
            }),
            message: localize('enableIdentityFail', 'Failed to enable system-assigned identity for environment "{0}"', context.managedEnvironment?.name)
        };
    }
}
