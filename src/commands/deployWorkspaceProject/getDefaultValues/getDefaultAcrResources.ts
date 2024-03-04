/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type Registry } from "@azure/arm-containerregistry";
import { nonNullProp, type ISubscriptionActionContext } from "@microsoft/vscode-azext-utils";
import { ext } from "../../../extensionVariables";
import { type ContainerAppItem } from "../../../tree/ContainerAppItem";
import { type ManagedEnvironmentItem } from "../../../tree/ManagedEnvironmentItem";
import { localize } from "../../../utils/localize";
import { ImageNameStep } from "../../image/imageSource/buildImageInAzure/ImageNameStep";
import { AcrListStep } from "../../image/imageSource/containerRegistry/acr/AcrListStep";
import { type DeployWorkspaceProjectSettingsV1 } from "../settings/DeployWorkspaceProjectSettingsV1";
import { triggerSettingsOverride } from "./getDefaultContextValues";

interface DefaultAcrResources {
    registry?: Registry;
    imageName?: string;
}

export async function getDefaultAcrResources(
    context: ISubscriptionActionContext,
    settings: DeployWorkspaceProjectSettingsV1,
    item: ContainerAppItem | ManagedEnvironmentItem | undefined
): Promise<DefaultAcrResources> {
    const noMatchingResource = { registry: undefined, imageName: undefined };

    if (!settings.containerRegistryName || triggerSettingsOverride(settings, item)) {
        return noMatchingResource;
    }

    const registries: Registry[] = await AcrListStep.getRegistries(context);
    const savedRegistry: Registry | undefined = registries.find(r => r.name === settings.containerRegistryName);

    if (savedRegistry) {
        ext.outputChannel.appendLog(localize('foundResourceMatch', 'Used saved workspace settings and found an existing container registry.'));
        return {
            registry: savedRegistry,
            imageName: ImageNameStep.getTimestampedImageName(settings.containerAppName || nonNullProp(savedRegistry, 'name'))
        };
    } else {
        ext.outputChannel.appendLog(localize('noResourceMatch', 'Used saved workspace settings to search for Azure Container Registry "{0}" but found no match.', settings.containerRegistryName));
        return noMatchingResource;
    }
}
