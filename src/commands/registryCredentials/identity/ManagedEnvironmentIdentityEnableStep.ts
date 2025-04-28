/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownManagedServiceIdentityType, type ContainerAppsAPIClient, type ManagedEnvironment } from "@azure/arm-appcontainers";
import { parseAzureResourceId, type ParsedAzureResourceId } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardExecuteStepWithActivityOutput, nonNullProp } from "@microsoft/vscode-azext-utils";
import { type Progress } from "vscode";
import { createContainerAppsAPIClient } from "../../../utils/azureClients";
import { localize } from "../../../utils/localize";
import { type ManagedIdentityRegistryCredentialsContext } from "./ManagedIdentityRegistryCredentialsContext";

export class ManagedEnvironmentIdentityEnableStep<T extends ManagedIdentityRegistryCredentialsContext> extends AzureWizardExecuteStepWithActivityOutput<T> {
    public priority: number = 450;
    public stepName: string = 'managedEnvironmentIdentityEnableStep';
    protected getOutputLogSuccess = (context: T) => localize('enableIdentitySuccess', 'Enabled system-assigned identity for environment "{0}"', context.managedEnvironment?.name);
    protected getOutputLogFail = (context: T) => localize('enableIdentityFail', 'Failed to enable system-assigned identity for environment "{0}"', context.managedEnvironment?.name);
    protected getTreeItemLabel = (context: T) => localize('enableIdentity', 'Enable system-assigned identity for environment "{0}"', context.managedEnvironment?.name);

    public async execute(context: T, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const client: ContainerAppsAPIClient = await createContainerAppsAPIClient(context);
        const managedEnvironment: ManagedEnvironment = nonNullProp(context, 'managedEnvironment');
        const parsedResourceId: ParsedAzureResourceId = parseAzureResourceId(nonNullProp(managedEnvironment, 'id'));

        progress.report({ message: localize('enablingIdentity', 'Enabling managed identity...') });
        context.managedEnvironment = await client.managedEnvironments.beginUpdateAndWait(parsedResourceId.resourceGroup, parsedResourceId.resourceName,
            {
                location: managedEnvironment.location,
                identity: {
                    type: KnownManagedServiceIdentityType.SystemAssigned,
                },
            }
        );
    }

    public shouldExecute(context: T): boolean {
        return !!context.managedEnvironment && !context.managedEnvironment.identity?.principalId;
    }
}
