/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ResourceGroup } from "@azure/arm-resources";
import { LocationListStep, ResourceGroupListStep } from "@microsoft/vscode-azext-azureutils";
import { nonNullValue, nonNullValueAndProp } from "@microsoft/vscode-azext-utils";
import { type ManagedEnvironmentItem } from "../../tree/ManagedEnvironmentItem";
import { StartingResourcesLogStep } from "../StartingResourcesLogStep";
import { type ContainerAppCreateContext } from "./ContainerAppCreateContext";

export class ContainerAppCreateStartingResourcesLogStep<T extends ContainerAppCreateContext> extends StartingResourcesLogStep<T> {
    constructor(readonly parentItem: ManagedEnvironmentItem) {
        super();
    }

    async configureStartingResources(context: T): Promise<void> {
        // Use the same resource group and location as the parent resource (managed environment)
        const resourceGroupName: string = nonNullValueAndProp(this.parentItem.resource, 'resourceGroup');
        const resourceGroups: ResourceGroup[] = await ResourceGroupListStep.getResourceGroups(context);
        context.resourceGroup = nonNullValue(resourceGroups.find(rg => rg.name === resourceGroupName));

        await LocationListStep.setLocation(context, nonNullValueAndProp(this.parentItem.resource, 'location'));
    }
}
