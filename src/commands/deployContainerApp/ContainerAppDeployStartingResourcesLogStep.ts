/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ResourceGroup } from "@azure/arm-resources";
import { LocationListStep, ResourceGroupListStep } from "@microsoft/vscode-azext-azureutils";
import { nonNullValue, nonNullValueAndProp } from "@microsoft/vscode-azext-utils";
import { localize } from "../../utils/localize";
import { StartingResourcesLogStep } from "../StartingResourcesLogStep";
import { type ContainerAppDeployContext } from "./ContainerAppDeployContext";

export class ContainerAppDeployStartingResourcesLogStep<T extends ContainerAppDeployContext> extends StartingResourcesLogStep<T> {
    async configureStartingResources(context: T): Promise<void> {
        const resourceGroups: ResourceGroup[] = await ResourceGroupListStep.getResourceGroups(context);
        context.resourceGroup = nonNullValue(
            resourceGroups.find(rg => rg.name === context.containerApp?.resourceGroup),
            localize('containerAppResourceGroup', 'Expected to find the container app\'s resource group.'),
        );
        await LocationListStep.setLocation(context, nonNullValueAndProp(context.containerApp, 'location'));
    }
}
