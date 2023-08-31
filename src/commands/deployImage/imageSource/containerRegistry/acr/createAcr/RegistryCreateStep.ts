/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ContainerRegistryManagementClient } from "@azure/arm-containerregistry";
import { LocationListStep } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardExecuteStep, GenericTreeItem, nonNullProp, nonNullValueAndProp } from "@microsoft/vscode-azext-utils";
import { Progress } from "vscode";
import { activityFailContext, activityFailIcon, activitySuccessContext, activitySuccessIcon } from "../../../../../../constants";
import { ExecuteActivityOutput, createActivityChildContext, tryCatchActivityWrapper } from "../../../../../../utils/activityUtils";
import { createContainerRegistryManagementClient } from "../../../../../../utils/azureClients";
import { localize } from "../../../../../../utils/localize";
import { CreateAcrContext } from "./CreateAcrContext";

export class RegistryCreateStep extends AzureWizardExecuteStep<CreateAcrContext> {
    public priority: number = 350;
    private success: ExecuteActivityOutput = {};
    private fail: ExecuteActivityOutput = {};

    public async execute(context: CreateAcrContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        this.initSuccessOutput(context);
        this.initFailOutput(context);

        await tryCatchActivityWrapper(
            async () => {
                const client: ContainerRegistryManagementClient = await createContainerRegistryManagementClient(context);

                progress.report({ message: localize('creatingRegistry', 'Creating registry...') });

                context.registry = await client.registries.beginCreateAndWait(
                    nonNullValueAndProp(context.resourceGroup, 'name'),
                    nonNullProp(context, 'newRegistryName'),
                    {
                        location: (await LocationListStep.getLocation(context)).name,
                        sku: { name: nonNullProp(context, 'newRegistrySku') },
                        adminUserEnabled: true
                    }
                );
            },
            context, this.success, this.fail
        )
    }

    public shouldExecute(context: CreateAcrContext): boolean {
        return !!context.newRegistryName && !!context.newRegistrySku && !context.registry;
    }

    private initSuccessOutput(context: CreateAcrContext): void {
        this.success.item = new GenericTreeItem(undefined, {
            contextValue: createActivityChildContext(['registryCreateStep', activitySuccessContext]),
            label: localize('createRegistryLabel', 'Create Azure Container Registry "{0}"', context.newRegistryName),
            iconPath: activitySuccessIcon
        });
        this.success.output = localize('createRegistrySuccess', 'Created Azure Container Registry "{0}".', context.newRegistryName);
    }

    private initFailOutput(context: CreateAcrContext): void {
        this.fail.item = new GenericTreeItem(undefined, {
            contextValue: createActivityChildContext(['registryCreateStep', activityFailContext]),
            label: localize('createRegistryLabel', 'Create Azure Container Registry "{0}"', context.newRegistryName),
            iconPath: activityFailIcon
        });
        this.fail.output = localize('createRegistryFail', 'Failed to create Azure Container Registry "{0}".', context.newRegistryName);
    }
}
