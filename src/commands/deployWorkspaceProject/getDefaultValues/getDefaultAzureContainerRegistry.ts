/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { Registry } from "@azure/arm-containerregistry";
import { ISubscriptionActionContext } from "@microsoft/vscode-azext-utils";
import { WorkspaceFolder } from "vscode";
import { fullRelativeSettingsFilePath } from "../../../constants";
import { ext } from "../../../extensionVariables";
import { localize } from "../../../utils/localize";
import { AcrListStep } from "../../deployImage/imageSource/containerRegistry/acr/AcrListStep";
import { IDeployWorkspaceProjectSettings, getContainerAppDeployWorkspaceSettings } from "../getContainerAppDeployWorkspaceSettings";

export async function getDefaultAzureContainerRegistry(context: ISubscriptionActionContext, rootFolder: WorkspaceFolder): Promise<{ registry?: Registry }> {
    const registries: Registry[] = await AcrListStep.getRegistries(context);
    const noMatchingResource = { registry: undefined };

    // See if there is a local workspace configuration to leverage
    const settings: IDeployWorkspaceProjectSettings | undefined = await getContainerAppDeployWorkspaceSettings(rootFolder);
    if (!settings) {
        ext.outputChannel.appendLog(localize('noWorkspaceSettings', 'Scanned and found no local workspace resource settings at "{0}".', fullRelativeSettingsFilePath));
        return noMatchingResource;
    } else if (!settings.acrName) {
        ext.outputChannel.appendLog(localize('noResources', 'Scanned and found incomplete Azure Container Registry settings at "{0}".', fullRelativeSettingsFilePath));
        return noMatchingResource;
    }

    const savedRegistry: Registry | undefined = registries.find(r => r.name === settings.acrName);
    if (savedRegistry) {
        ext.outputChannel.appendLog(localize('foundResourceMatch', 'Used saved workspace settings and found an existing container registry.'));
        return {
            registry: savedRegistry
        };
    } else {
        ext.outputChannel.appendLog(localize('noResourceMatch', 'Used saved workspace settings to search for Azure Container Registry "{0}" but found no match.', settings.acrName));
        return noMatchingResource;
    }
}
