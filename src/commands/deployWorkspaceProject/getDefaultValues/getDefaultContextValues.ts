/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import type { ISubscriptionActionContext } from "@microsoft/vscode-azext-utils";
import type { DeployWorkspaceProjectContext } from "../DeployWorkspaceProjectContext";
import { getWorkspaceProjectPaths } from "./getWorkspaceProjectPaths";

export async function getDefaultContextValues(context: ISubscriptionActionContext): Promise<Partial<DeployWorkspaceProjectContext>> {
    const { rootFolder, dockerfilePath } = await getWorkspaceProjectPaths(context);

    // const settings: IDeployWorkspaceProjectSettings | undefined = await getDeployWorkspaceProjectSettings(rootFolder);
    // if (!settings) {
    //     ext.outputChannel.appendLog(localize('noWorkspaceSettings', 'Scanned and found no matching resource settings at "{0}".', relativeSettingsFilePath));
    // } else if (!settings.containerAppResourceGroupName || !settings.containerAppName || !settings.containerRegistryName) {
    //     ext.outputChannel.appendLog(localize('resourceSettingsIncomplete', 'Scanned and found incomplete container app resource settings at "{0}".', relativeSettingsFilePath));
    // }

    return {
        // ...await getDefaultContainerAppsResources(context, settings),
        // ...await getDefaultAzureContainerRegistry(context, settings),
        // newRegistrySku: KnownSkuName.Basic,
        dockerfilePath,
        // environmentVariables: await EnvironmentVariablesListStep.workspaceHasEnvFile() ? undefined : [],
        // imageSource: ImageSource.RemoteAcrBuild,
        // os: AcrBuildSupportedOS.Linux,
        rootFolder,
    };
}
