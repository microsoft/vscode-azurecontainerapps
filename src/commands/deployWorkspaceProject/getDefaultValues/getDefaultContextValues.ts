/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { KnownSkuName } from "@azure/arm-containerregistry";
import { parseAzureResourceId } from "@microsoft/vscode-azext-azureutils";
import { nonNullValue, type ISubscriptionActionContext } from "@microsoft/vscode-azext-utils";
import { type WorkspaceFolder } from "vscode";
import { ImageSource, dockerFilePick, dockerfileGlobPattern } from "../../../constants";
import { ext } from "../../../extensionVariables";
import { ContainerAppItem } from "../../../tree/ContainerAppItem";
import { ManagedEnvironmentItem } from "../../../tree/ManagedEnvironmentItem";
import { localize } from "../../../utils/localize";
import { selectWorkspaceFile } from "../../../utils/workspaceUtils";
import { EnvironmentVariablesListStep } from "../../image/imageSource/EnvironmentVariablesListStep";
import { AcrBuildSupportedOS } from "../../image/imageSource/buildImageInAzure/OSPickStep";
import { type DeployWorkspaceProjectContext } from "../DeployWorkspaceProjectContext";
import { type DeployWorkspaceProjectSettingsV1 } from "../settings/DeployWorkspaceProjectSettingsV1";
import { dwpSettingUtilsV1 } from "../settings/dwpSettingUtilsV1";
import { getDefaultAcrResources } from "./getDefaultAcrResources";
import { getDefaultContainerAppsResources } from "./getDefaultContainerAppsResources/getDefaultContainerAppsResources";
import { getWorkspaceProjectRootFolder } from "./getWorkspaceProjectRootFolder";

export async function getDefaultContextValues(
    context: ISubscriptionActionContext & Partial<DeployWorkspaceProjectContext>,
    item: ContainerAppItem | ManagedEnvironmentItem | undefined
): Promise<Partial<DeployWorkspaceProjectContext>> {
    const rootFolder: WorkspaceFolder = context.rootFolder ?? await getWorkspaceProjectRootFolder(context);
    const dockerfilePath: string = context.dockerfilePath ?? nonNullValue(await selectWorkspaceFile(context, dockerFilePick, { filters: {}, autoSelectIfOne: true }, `**/${dockerfileGlobPattern}`));

    const settings: DeployWorkspaceProjectSettingsV1 = await dwpSettingUtilsV1.getDeployWorkspaceProjectSettings(rootFolder);
    dwpSettingUtilsV1.setDeployWorkspaceProjectSettingsTelemetry(context, settings);

    // Logic to display local workspace settings related outputs
    if (triggerSettingsOverride(settings, item)) {
        // Tree item & settings conflict
        context.telemetry.properties.settingsOverride = 'triggered';
        await displaySettingsOverrideWarning(context, item as ContainerAppItem | ManagedEnvironmentItem);
        context.telemetry.properties.settingsOverride = 'accepted';
    } else {
        // No settings conflict
        context.telemetry.properties.settingsOverride = 'none';
        dwpSettingUtilsV1.displayDeployWorkspaceProjectSettingsOutput(settings);
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
export function triggerSettingsOverride(settings: DeployWorkspaceProjectSettingsV1, item: ContainerAppItem | ManagedEnvironmentItem | undefined): boolean {
    if (!item || (!settings.containerAppName && !settings.containerAppResourceGroupName)) {
        return false;
    } else if (ManagedEnvironmentItem.isManagedEnvironmentItem(item)) {
        return true;
    }

    // At this point it must be a `ContainerAppItem`
    return item.containerApp.name !== settings.containerAppName || item.containerApp.resourceGroup !== settings.containerAppResourceGroupName;
}

async function displaySettingsOverrideWarning(context: ISubscriptionActionContext, item: ContainerAppItem | ManagedEnvironmentItem): Promise<void> {
    let treeItemType: string | undefined;
    if (ContainerAppItem.isContainerAppItem(item)) {
        treeItemType = 'container app item';
    } else if (ManagedEnvironmentItem.isManagedEnvironmentItem(item)) {
        treeItemType = 'container environment item';
    }

    const resourceName: string = parseAzureResourceId(item.id).resourceName;
    await context.ui.showWarningMessage(
        localize('overrideConfirmation', `Deployment will target {0} "{1}".\n\nAny workspace deployment settings will be skipped.  Would you like to proceed?`, nonNullValue(treeItemType), resourceName),
        { modal: true },
        { title: localize('continue', 'Continue') }
    );

    ext.outputChannel.appendLog(localize('confirmedOverride', 'User confirmed deployment will target {0} "{1}" instead of existing workspace settings.', nonNullValue(treeItemType), resourceName));
}
