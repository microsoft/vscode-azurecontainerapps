/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { Registry } from "@azure/arm-containerregistry";
import { ISubscriptionActionContext } from "@microsoft/vscode-azext-utils";
import { relativeSettingsFilePath } from "../../../constants";
import { ext } from "../../../extensionVariables";
import { localize } from "../../../utils/localize";
import { AcrListStep } from "../../deployImage/imageSource/containerRegistry/acr/AcrListStep";
import { IDeployWorkspaceProjectSettings } from "../deployWorkspaceProjectSettings";

interface DefaultRegistryResources {
    registry?: Registry;
    imageName?: string;
}

export async function getDefaultAzureContainerRegistry(context: ISubscriptionActionContext, settings: IDeployWorkspaceProjectSettings | undefined): Promise<DefaultRegistryResources> {
    const registries: Registry[] = await AcrListStep.getRegistries(context);
    const noMatchingResource = { registry: undefined };

    if (!settings) {
        // No need to output a no settings message again
        return noMatchingResource;
    } else if (!settings.containerRegistryName) {
        ext.outputChannel.appendLog(localize('noResources', 'Scanned and found incomplete Azure Container Registry settings at "{0}".', relativeSettingsFilePath));
        return noMatchingResource;
    }

    const savedRegistry: Registry | undefined = registries.find(r => r.name === settings.containerRegistryName);
    if (savedRegistry) {
        ext.outputChannel.appendLog(localize('foundResourceMatch', 'Used saved workspace settings and found an existing container registry.'));
        return {
            registry: savedRegistry,
            imageName: `${settings.containerAppName || savedRegistry.name}:latest`
        };
    } else {
        ext.outputChannel.appendLog(localize('noResourceMatch', 'Used saved workspace settings to search for Azure Container Registry "{0}" but found no match.', settings.containerRegistryName));
        return noMatchingResource;
    }
}
