/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type ExecuteActivityContext } from "@microsoft/vscode-azext-utils";
import { type AzureResourcesExtensionApiWithActivity } from "@microsoft/vscode-azext-utils/activity";
import { ext } from "../extensionVariables";
import { settingUtils } from "./settingUtils";

export async function createActivityContext(withChildren?: boolean): Promise<ExecuteActivityContext> {
    return {
        registerActivity: async (activity) => (ext.rgApiV2 as AzureResourcesExtensionApiWithActivity).activity.registerActivity(activity),
        suppressNotification: await settingUtils.getSetting('suppressActivityNotifications', undefined, 'azureResourceGroups'),
        activityChildren: withChildren ? [] : undefined,
    };
}
