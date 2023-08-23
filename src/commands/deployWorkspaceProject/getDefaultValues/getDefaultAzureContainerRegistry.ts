/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { Registry } from "@azure/arm-containerregistry";
import { ISubscriptionActionContext } from "@microsoft/vscode-azext-utils";
import { AcrListStep } from "../../deployImage/imageSource/containerRegistry/acr/AcrListStep";

interface DefaultAzureContainerRegistry {
    registry?: Registry;
    newRegistryName?: string;
}

export async function getDefaultAzureContainerRegistry(context: ISubscriptionActionContext, resourceNameBase: string): Promise<DefaultAzureContainerRegistry> {
    const registries: Registry[] = await AcrListStep.getRegistries(context);
    const registry: Registry | undefined = registries.find(r => r.name === resourceNameBase);

    // If no registry, create new (add later)

    return {
        registry,
        newRegistryName: undefined
    };
}
