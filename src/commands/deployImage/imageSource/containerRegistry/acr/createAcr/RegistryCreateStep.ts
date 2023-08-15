/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ContainerRegistryManagementClient } from "@azure/arm-containerregistry";
import { LocationListStep } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardExecuteStep, nonNullProp } from "@microsoft/vscode-azext-utils";
import { createContainerRegistryManagementClient } from "../../../../../../utils/azureClients";
import { ICreateAcrContext } from "./ICreateAcrContext";

export class RegistryCreateStep extends AzureWizardExecuteStep<ICreateAcrContext> {
    public priority: number = 150;

    public async execute(context: ICreateAcrContext): Promise<void> {
        const client: ContainerRegistryManagementClient = await createContainerRegistryManagementClient(context);

        context.registry = await client.registries.beginCreateAndWait(
            nonNullProp(context, 'newResourceGroupName'),
            nonNullProp(context, 'registryName'),
            {
                location: (await LocationListStep.getLocation(context)).name,
                sku: { name: nonNullProp(context, 'sku') },
                adminUserEnabled: true
            }
        );
    }

    public shouldExecute(): boolean {
        return true;
    }
}