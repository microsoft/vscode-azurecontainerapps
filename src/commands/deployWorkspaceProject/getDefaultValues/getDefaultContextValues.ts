/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { KnownSkuName } from "@azure/arm-containerregistry";
import { parseAzureResourceId } from "@microsoft/vscode-azext-azureutils";
import { nonNullValue, type ISubscriptionActionContext } from "@microsoft/vscode-azext-utils";
import { ImageSource } from "../../../constants";
import { ext } from "../../../extensionVariables";
import { ContainerAppItem } from "../../../tree/ContainerAppItem";
import { ManagedEnvironmentItem } from "../../../tree/ManagedEnvironmentItem";
import { localize } from "../../../utils/localize";
import { EnvironmentVariablesListStep } from "../../image/imageSource/EnvironmentVariablesListStep";
import { AcrBuildSupportedOS } from "../../image/imageSource/buildImageInAzure/OSPickStep";
import type { DeployWorkspaceProjectContext } from "../DeployWorkspaceProjectContext";
import { DeployWorkspaceProjectSettings, displayDeployWorkspaceProjectSettingsOutput, getDeployWorkspaceProjectSettings } from "../deployWorkspaceProjectSettings";
import { getDefaultAcrResources } from "./getDefaultAcrResources";
import { getDefaultContainerAppsResources } from "./getDefaultContainerAppsResources/getDefaultContainerAppsResources";
import { getWorkspaceProjectPaths } from "./getWorkspaceProjectPaths";

export async function getDefaultContextValues(context: ISubscriptionActionContext, item?: ContainerAppItem | ManagedEnvironmentItem): Promise<Partial<DeployWorkspaceProjectContext>> {
    const { rootFolder, dockerfilePath } = await getWorkspaceProjectPaths(context);
    const settings: DeployWorkspaceProjectSettings = await getDeployWorkspaceProjectSettings(rootFolder);

    if (triggerSettingsOverride(settings, item)) {
        // Tree item / settings conflict
        await displaySettingsOverrideWarning(context, item as ContainerAppItem | ManagedEnvironmentItem);
    } else {
        // No settings conflict
        displayDeployWorkspaceProjectSettingsOutput(settings);
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
