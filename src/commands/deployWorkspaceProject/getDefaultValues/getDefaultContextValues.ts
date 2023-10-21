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
import { DeployWorkspaceProjectSettings, getDeployWorkspaceProjectSettings, hasAllDeployWorkspaceProjectSettings, hasAtLeastOneDeployWorkspaceProjectSetting, hasNoDeployWorkspaceProjectSettings } from "../deployWorkspaceProjectSettings";
import { getDefaultAcrResources } from "./getDefaultAcrResources";
import { getDefaultContainerAppsResources } from "./getDefaultContainerAppsResources/getDefaultContainerAppsResources";
import { getWorkspaceProjectPaths } from "./getWorkspaceProjectPaths";

export async function getDefaultContextValues(context: ISubscriptionActionContext, item?: ContainerAppItem | ManagedEnvironmentItem): Promise<Partial<DeployWorkspaceProjectContext>> {
    const { rootFolder, dockerfilePath } = await getWorkspaceProjectPaths(context);
    const settings: DeployWorkspaceProjectSettings = await getDeployWorkspaceProjectSettings(rootFolder);

    // Settings logs
    if (hasAllDeployWorkspaceProjectSettings(settings)) {
        context.telemetry.properties.workspaceSettingsState = 'all';
        // Don't worry about these output logs just yet, more comprehensive resource logs will come once we start trying to acquire the resources
    } else if (hasAtLeastOneDeployWorkspaceProjectSetting(settings)) {
        context.telemetry.properties.workspaceSettingsState = 'partial';
        ext.outputChannel.appendLog(localize('resourceSettingsIncomplete', 'Scanned and found incomplete container app resource settings at "{0}".', relativeSettingsFilePath));
    } else if (hasNoDeployWorkspaceProjectSettings(settings)) {
        context.telemetry.properties.workspaceSettingsState = 'none';
        ext.outputChannel.appendLog(localize('noWorkspaceSettings', 'Scanned and found no matching resource settings at "{0}".', relativeSettingsFilePath));
    }

    // Settings override warning
    if (triggerSettingsOverride(settings, item)) {
        context.telemetry.properties.triggeredSettingsOverride = 'true';
        await displaySettingsOverrideWarning(context, item as ContainerAppItem | ManagedEnvironmentItem);
        context.telemetry.properties.acceptedSettingsOverride = 'true';
    }

    return {
        ...await getDefaultContainerAppsResources(context, settings, item),
        ...await getDefaultAcrResources(context, settings, item),
        newRegistrySku: KnownSkuName.Basic,
        dockerfilePath,
        environmentVariables: await EnvironmentVariablesListStep.workspaceHasEnvFile() ? undefined : [],
        imageSource: ImageSource.RemoteAcrBuild,
        os: AcrBuildSupportedOS.Linux,
        rootFolder,
    };
}

/**
 * Determines if deploying from the given tree item will cause us to have to override the user's workspace deployment settings
 */
export function triggerSettingsOverride(settings: DeployWorkspaceProjectSettings, item: ContainerAppItem | ManagedEnvironmentItem | undefined): boolean {
    if (!item || (!settings.containerAppName && !settings.containerAppResourceGroupName)) {
        return false;
    } else if (ManagedEnvironmentItem.isManagedEnvironmentItem(item)) {
        return true;
    }

    // At this point it must be a `ContainerAppItem`
    return item.containerApp.name !== settings.containerAppName || item.containerApp.resourceGroup !== settings.containerAppResourceGroupName;
}

async function displaySettingsOverrideWarning(context: ISubscriptionActionContext, item: ContainerAppItem | ManagedEnvironmentItem): Promise<void> {
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
