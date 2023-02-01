/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ExecuteActivityContext } from "@microsoft/vscode-azext-utils";
// import type { AzureResourcesExtensionApiWithActivity } from "@microsoft/vscode-azext-utils/activity";
import { ext } from "../extensionVariables";
import { settingUtils } from "../utils/settingUtils";

export async function createActivityContext(): Promise<ExecuteActivityContext> {
    return {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
        registerActivity: async (activity) => (ext.rgApiV2 as any).activity.registerActivity(activity),
        suppressNotification: await settingUtils.getWorkspaceSetting('suppressActivityNotifications', undefined, 'azureResourceGroups'),
    };
}
