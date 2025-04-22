/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { activityInfoContext, type ActivityChildItemBase, type ExecuteActivityContext } from "@microsoft/vscode-azext-utils";
import { type AzureResourcesExtensionApiWithActivity } from "@microsoft/vscode-azext-utils/activity";
import { ext } from "../extensionVariables";
import { settingUtils } from "./settingUtils";

export async function createActivityContext(options?: { withChildren?: boolean }): Promise<ExecuteActivityContext> {
    return {
        registerActivity: async (activity) => (ext.rgApiV2 as AzureResourcesExtensionApiWithActivity).activity.registerActivity(activity),
        suppressNotification: await settingUtils.getSetting('suppressActivityNotifications', undefined, 'azureResourceGroups'),
        activityChildren: options?.withChildren ? [] : undefined,
    };
}

export function addActivityInfoChild(context: ExecuteActivityContext, child: ActivityChildItemBase): void {
    if (!context.activityChildren) {
        return;
    }

    const idx: number = context.activityChildren
        .map(child => child.contextValue?.includes(activityInfoContext) ? activityInfoContext : child.contextValue)
        .lastIndexOf(activityInfoContext);

    if (idx === -1) {
        context.activityChildren.unshift(child);
    } else {
        context.activityChildren.splice(idx + 1, 0, child);
    }
}
