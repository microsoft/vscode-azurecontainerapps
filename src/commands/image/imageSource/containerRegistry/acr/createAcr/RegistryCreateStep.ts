/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type ContainerRegistryManagementClient } from "@azure/arm-containerregistry";
import { LocationListStep } from "@microsoft/vscode-azext-azureutils";
import { GenericParentTreeItem, GenericTreeItem, activityFailContext, activityFailIcon, activitySuccessContext, activitySuccessIcon, nonNullProp, nonNullValueAndProp } from "@microsoft/vscode-azext-utils";
import { type Progress } from "vscode";
import { ExecuteActivityOutputStepBase, type ExecuteActivityOutput } from "../../../../../../utils/activity/ExecuteActivityOutputStepBase";
import { createActivityChildContext } from "../../../../../../utils/activity/activityUtils";
import { createContainerRegistryManagementClient } from "../../../../../../utils/azureClients";
import { localize } from "../../../../../../utils/localize";
import { type CreateAcrContext } from "./CreateAcrContext";

export class RegistryCreateStep extends ExecuteActivityOutputStepBase<CreateAcrContext> {
    public priority: number = 350;

    protected async executeCore(context: CreateAcrContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        progress.report({ message: localize('creatingRegistry', 'Creating registry...') });

        const client: ContainerRegistryManagementClient = await createContainerRegistryManagementClient(context);
        context.registry = await client.registries.beginCreateAndWait(
            nonNullValueAndProp(context.resourceGroup, 'name'),
            nonNullProp(context, 'newRegistryName'),
            {
                location: (await LocationListStep.getLocation(context)).name,
                sku: { name: nonNullProp(context, 'newRegistrySku') },
                // Todo: Remove admin flag
                // Do we need to add logic prompting to remove existing admin user enabled flags?
                adminUserEnabled: true
            }
        );
    }

    public shouldExecute(context: CreateAcrContext): boolean {
        return !context.registry;
    }

    protected createSuccessOutput(context: CreateAcrContext): ExecuteActivityOutput {
        return {
            item: new GenericTreeItem(undefined, {
                contextValue: createActivityChildContext(['registryCreateStepSuccessItem', activitySuccessContext]),
                label: localize('createRegistryLabel', 'Create container registry "{0}"', context.newRegistryName),
                iconPath: activitySuccessIcon
            }),
            message: localize('createRegistrySuccess', 'Created container registry "{0}".', context.newRegistryName)
        };
    }

    protected createFailOutput(context: CreateAcrContext): ExecuteActivityOutput {
        return {
            item: new GenericParentTreeItem(undefined, {
                contextValue: createActivityChildContext(['registryCreateStepFailItem', activityFailContext]),
                label: localize('createRegistryLabel', 'Create container registry "{0}"', context.newRegistryName),
                iconPath: activityFailIcon
            }),
            message: localize('createRegistryFail', 'Failed to create container registry "{0}".', context.newRegistryName)
        };
    }
}
