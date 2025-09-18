/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type ContainerRegistryManagementClient } from "@azure/arm-containerregistry";
import { LocationListStep } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardExecuteStepWithActivityOutput, nonNullProp, nonNullValueAndProp, type ISubscriptionActionContext } from "@microsoft/vscode-azext-utils";
import { type Progress } from "vscode";
import { createContainerRegistryManagementClient } from "../../../../../../utils/azureClients";
import { localize } from "../../../../../../utils/localize";
import { type CreateAcrContext } from "./CreateAcrContext";

// Made the base context partial here to help improve type compatability with some other command entrypoints
type RegistryCreateContext = Partial<CreateAcrContext> & ISubscriptionActionContext;

export class RegistryCreateStep<T extends RegistryCreateContext> extends AzureWizardExecuteStepWithActivityOutput<T> {
    public priority: number = 350;
    public stepName: string = 'registryCreateStep';
    protected getOutputLogSuccess = (context: T) => localize('createRegistrySuccess', 'Created container registry "{0}".', context.newRegistryName);
    protected getOutputLogFail = (context: T) => localize('createRegistryFail', 'Failed to create container registry "{0}".', context.newRegistryName);
    protected getTreeItemLabel = (context: T) => localize('createRegistryLabel', 'Create container registry "{0}"', context.newRegistryName);

    public async execute(context: T, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        progress.report({ message: localize('creatingRegistry', 'Creating registry...') });

        const client: ContainerRegistryManagementClient = await createContainerRegistryManagementClient(context);
        context.registry = await client.registries.beginCreateAndWait(
            nonNullValueAndProp(context.resourceGroup, 'name'),
            nonNullProp(context, 'newRegistryName'),
            {
                location: (await LocationListStep.getLocation(context)).name,
                sku: { name: nonNullProp(context, 'newRegistrySku') },
            }
        );
    }

    public shouldExecute(context: T): boolean {
        return !context.registry;
    }
}
