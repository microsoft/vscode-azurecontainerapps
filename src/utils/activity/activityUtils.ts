/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ExecuteActivityContext, createContextValue } from "@microsoft/vscode-azext-utils";
import type { AzureResourcesExtensionApiWithActivity } from "@microsoft/vscode-azext-utils/activity";
import { randomUUID } from "crypto";
import { ext } from "../../extensionVariables";
import { settingUtils } from "../settingUtils";

export async function createActivityContext(): Promise<ExecuteActivityContext> {
    return {
        registerActivity: async (activity) => (ext.rgApiV2 as AzureResourcesExtensionApiWithActivity).activity.registerActivity(activity),
        suppressNotification: await settingUtils.getSetting('suppressActivityNotifications', undefined, 'azureResourceGroups'),
    };
}

export function createActivityChildContext(contextValues: string[]): string {
    // Add randomUUID because contexts are required to be unique to avoid throwing errors in the tree view
    return createContextValue(contextValues) + `;${randomUUID()}`;
}
