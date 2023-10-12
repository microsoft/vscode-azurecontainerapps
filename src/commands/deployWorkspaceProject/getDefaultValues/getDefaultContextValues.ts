/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { KnownSkuName } from "@azure/arm-containerregistry";
import { parseAzureResourceId } from "@microsoft/vscode-azext-azureutils";
import { type ISubscriptionActionContext } from "@microsoft/vscode-azext-utils";
import { ImageSource, relativeSettingsFilePath } from "../../../constants";
import { ext } from "../../../extensionVariables";
import { ContainerAppItem } from "../../../tree/ContainerAppItem";
import { ManagedEnvironmentItem } from "../../../tree/ManagedEnvironmentItem";
import { localize } from "../../../utils/localize";
import { EnvironmentVariablesListStep } from "../../image/imageSource/EnvironmentVariablesListStep";
import { AcrBuildSupportedOS } from "../../image/imageSource/buildImageInAzure/OSPickStep";
import type { DeployWorkspaceProjectContext } from "../DeployWorkspaceProjectContext";
import { DeployWorkspaceProjectSettings, getDeployWorkspaceProjectSettings } from "../deployWorkspaceProjectSettings";
import { getDefaultAcrResources } from "./getDefaultAcrResources";
import { getDefaultContainerAppsResources } from "./getDefaultContainerAppsResources/getDefaultContainerAppsResources";
import { getWorkspaceProjectPaths } from "./getWorkspaceProjectPaths";

export async function getDefaultContextValues(context: ISubscriptionActionContext, item?: ContainerAppItem | ManagedEnvironmentItem): Promise<Partial<DeployWorkspaceProjectContext>> {
    const { rootFolder, dockerfilePath } = await getWorkspaceProjectPaths(context);
    const settings: DeployWorkspaceProjectSettings = await getDeployWorkspaceProjectSettings(rootFolder);

    if (!item) {
        if (!settings.containerAppName && !settings.containerAppResourceGroupName && !settings.containerRegistryName) {
            ext.outputChannel.appendLog(localize('noWorkspaceSettings', 'Scanned and found no matching resource settings at "{0}".', relativeSettingsFilePath));
        } else if (!settings.containerAppResourceGroupName || !settings.containerAppName || !settings.containerRegistryName) {
            ext.outputChannel.appendLog(localize('resourceSettingsIncomplete', 'Scanned and found incomplete container app resource settings at "{0}".', relativeSettingsFilePath));
        }
    } else if (item && (settings.containerAppName || settings.containerAppResourceGroupName)) {
        await displayTreeItemOverrideWarning(context, item);
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

async function displayTreeItemOverrideWarning(context: ISubscriptionActionContext, item: ContainerAppItem | ManagedEnvironmentItem): Promise<void> {
    let treeItemType: string;
    if (ContainerAppItem.isContainerAppItem(item)) {
        treeItemType = 'container app item ';
    } else if (ManagedEnvironmentItem.isManagedEnvironmentItem(item)) {
        treeItemType = 'container environment item ';
    } else {
        treeItemType = '';
    }

    const resourceName: string = parseAzureResourceId(item.id).resourceName;
    await context.ui.showWarningMessage(
        localize('overrideConfirmation', `Deployment will target {0}"{1}".\n\nAny workspace deployment settings will be skipped.  Would you like to proceed?`, treeItemType, resourceName),
        { modal: true },
        { title: localize('continue', 'Continue') }
    );
}
