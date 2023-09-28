/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ContainerRegistryManagementClient } from "@azure/arm-containerregistry";
import { LocationListStep } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardExecuteStep, nonNullProp } from "@microsoft/vscode-azext-utils";
import { createContainerRegistryManagementClient } from "../../../../../../utils/azureClients";
import { CreateAcrContext } from "./CreateAcrContext";

export class RegistryCreateStep extends AzureWizardExecuteStep<CreateAcrContext> {
    public priority: number = 350;

    public async execute(context: CreateAcrContext): Promise<void> {
        const client: ContainerRegistryManagementClient = await createContainerRegistryManagementClient(context);

        context.registry = await client.registries.beginCreateAndWait(
            nonNullProp(context, 'newResourceGroupName'),
            nonNullProp(context, 'newRegistryName'),
            {
                location: (await LocationListStep.getLocation(context)).name,
                sku: { name: nonNullProp(context, 'newRegistrySku') },
                adminUserEnabled: true
            }
        );
    }

    public shouldExecute(context: CreateAcrContext): boolean {
        return !!context.newRegistryName && !!context.newRegistrySku;
    }
}
