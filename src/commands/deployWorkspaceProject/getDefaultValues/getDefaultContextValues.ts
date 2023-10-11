/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { KnownSkuName } from "@azure/arm-containerregistry";
import { type ISubscriptionActionContext } from "@microsoft/vscode-azext-utils";
import { ImageSource, relativeSettingsFilePath } from "../../../constants";
import { ext } from "../../../extensionVariables";
import type { ContainerAppItem } from "../../../tree/ContainerAppItem";
import type { ManagedEnvironmentItem } from "../../../tree/ManagedEnvironmentItem";
import { localize } from "../../../utils/localize";
import { EnvironmentVariablesListStep } from "../../deployImage/imageSource/EnvironmentVariablesListStep";
import { AcrBuildSupportedOS } from "../../deployImage/imageSource/buildImageInAzure/OSPickStep";
import type { DeployWorkspaceProjectContext } from "../DeployWorkspaceProjectContext";
import { DeployWorkspaceProjectSettings, getDeployWorkspaceProjectSettings } from "../deployWorkspaceProjectSettings";
import { getDefaultAcrResources } from "./getDefaultAcrResources";
import { getDefaultContainerAppsResources } from "./getDefaultContainerAppsResources/getDefaultContainerAppsResources";
import { getWorkspaceProjectPaths } from "./getWorkspaceProjectPaths";
import { throwIfTreeItemAndWorkspaceSettingsConflict } from "./throwIfTreeItemAndWorkspaceSettingsConflict";

export async function getDefaultContextValues(context: ISubscriptionActionContext, item?: ContainerAppItem | ManagedEnvironmentItem): Promise<Partial<DeployWorkspaceProjectContext>> {
    const { rootFolder, dockerfilePath } = await getWorkspaceProjectPaths(context);
    const settings: DeployWorkspaceProjectSettings = await getDeployWorkspaceProjectSettings(rootFolder);

    await throwIfTreeItemAndWorkspaceSettingsConflict(context, item, settings);

    if (!settings.containerAppName && !settings.containerAppResourceGroupName && !settings.containerRegistryName) {
        ext.outputChannel.appendLog(localize('noWorkspaceSettings', 'Scanned and found no matching resource settings at "{0}".', relativeSettingsFilePath));
    } else if (!settings.containerAppResourceGroupName || !settings.containerAppName || !settings.containerRegistryName) {
        ext.outputChannel.appendLog(localize('resourceSettingsIncomplete', 'Scanned and found incomplete container app resource settings at "{0}".', relativeSettingsFilePath));
    }

    return {
        ...await getDefaultContainerAppsResources(context, settings, item),
        ...await getDefaultAcrResources(context, settings),
        newRegistrySku: KnownSkuName.Basic,
        dockerfilePath,
        environmentVariables: await EnvironmentVariablesListStep.workspaceHasEnvFile() ? undefined : [],
        imageSource: ImageSource.RemoteAcrBuild,
        os: AcrBuildSupportedOS.Linux,
        rootFolder,
    };
}
