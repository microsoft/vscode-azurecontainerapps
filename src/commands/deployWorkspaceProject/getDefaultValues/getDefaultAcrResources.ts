/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import type { Registry } from "@azure/arm-containerregistry";
import type { ISubscriptionActionContext } from "@microsoft/vscode-azext-utils";
import { ext } from "../../../extensionVariables";
import { localize } from "../../../utils/localize";
import { AcrListStep } from "../../image/imageSource/containerRegistry/acr/AcrListStep";
import { DeployWorkspaceProjectSettings } from "../DeployWorkspaceProjectSettings";

interface DefaultAcrResources {
    registry?: Registry;
    imageName?: string;
}

export async function getDefaultAcrResources(context: ISubscriptionActionContext, settings: DeployWorkspaceProjectSettings | undefined): Promise<DefaultAcrResources> {
    const noMatchingResource = { registry: undefined, imageName: undefined };

    if (!settings || !settings.containerRegistryName) {
        return noMatchingResource;
    }

    const registries: Registry[] = await AcrListStep.getRegistries(context);
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
