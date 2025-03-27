/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type AzExtParentTreeItem, type AzExtTreeItem, type ExecuteActivityContext } from "@microsoft/vscode-azext-utils";
import { type AzureResourcesExtensionApiWithActivity } from "@microsoft/vscode-azext-utils/activity";
import { ext } from "../extensionVariables";
import { settingUtils } from "./settingUtils";

/**
 * Adds a new activity child above the live progress item; required when adding new activity children during the middle of an execute step.
 */
export function insertActivityChildDuringProgress(context: ExecuteActivityContext, activityChild: AzExtTreeItem | AzExtParentTreeItem): void {
    if (!context.activityChildren) {
        return;
    }
    context.activityChildren.splice(context.activityChildren.length - 1, 0, activityChild);
    context.reportActivityProgress?.();
}

export async function createActivityContext(withChildren?: boolean): Promise<ExecuteActivityContext> {
    return {
        registerActivity: async (activity) => (ext.rgApiV2 as AzureResourcesExtensionApiWithActivity).activity.registerActivity(activity),
        suppressNotification: await settingUtils.getSetting('suppressActivityNotifications', undefined, 'azureResourceGroups'),
        activityChildren: withChildren ? [] : undefined,
    };
}
