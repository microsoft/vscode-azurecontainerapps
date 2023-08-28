/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { KnownSkuName } from "@azure/arm-containerregistry";
import { ISubscriptionActionContext } from "@microsoft/vscode-azext-utils";
import { ImageSource, fullRelativeSettingsFilePath } from "../../../constants";
import { ext } from "../../../extensionVariables";
import { localize } from "../../../utils/localize";
import { EnvironmentVariablesListStep } from "../../deployImage/imageSource/EnvironmentVariablesListStep";
import { AcrBuildSupportedOS } from "../../deployImage/imageSource/buildImageInAzure/OSPickStep";
import { IDeployWorkspaceProjectContext } from "../IDeployWorkspaceProjectContext";
import { IDeployWorkspaceProjectSettings, getContainerAppDeployWorkspaceSettings } from "../getContainerAppDeployWorkspaceSettings";
import { getDefaultAzureContainerRegistry } from "./getDefaultAzureContainerRegistry";
import { getDefaultContainerAppsResources } from "./getDefaultContainerAppsResources";
import { getWorkspaceProjectPaths } from "./getWorkspaceProjectPaths";

export async function getDefaultContextValues(context: ISubscriptionActionContext): Promise<Partial<IDeployWorkspaceProjectContext>> {
    const { rootFolder, dockerfilePath } = await getWorkspaceProjectPaths(context);

    const settings: IDeployWorkspaceProjectSettings | undefined = await getContainerAppDeployWorkspaceSettings(rootFolder);
    if (!settings) {
        ext.outputChannel.appendLog(localize('noWorkspaceSettings', 'Scanned and found no local workspace resource settings at "{0}".', fullRelativeSettingsFilePath));
    }

    return {
        ...await getDefaultContainerAppsResources(context, settings),
        ...await getDefaultAzureContainerRegistry(context, settings),
        newRegistrySku: KnownSkuName.Basic,
        dockerfilePath,
        environmentVariables: await EnvironmentVariablesListStep.workspaceHasEnvFile() ? undefined : [],
        imageSource: ImageSource.RemoteAcrBuild,
        os: AcrBuildSupportedOS.Linux,
        rootFolder,
    };
}
