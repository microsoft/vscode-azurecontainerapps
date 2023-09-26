/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ExecuteActivityContext, IActionContext, createContextValue } from "@microsoft/vscode-azext-utils";
import type { AzureResourcesExtensionApiWithActivity } from "@microsoft/vscode-azext-utils/activity";
import { randomUUID } from "crypto";
import { ext } from "../../extensionVariables";
import { settingUtils } from "../settingUtils";
import { ExecuteActivityOutput } from "./ExecuteActivityOutputStepBase";

export async function createActivityContext(): Promise<ExecuteActivityContext> {
    return {
        registerActivity: async (activity) => (ext.rgApiV2 as AzureResourcesExtensionApiWithActivity).activity.registerActivity(activity),
        suppressNotification: await settingUtils.getWorkspaceSetting('suppressActivityNotifications', undefined, undefined, 'azureResourceGroups'),
    };
}

export function createActivityChildContext(contextValues: string[]): string {
    // Add randomUUID because contexts are required to be unique to avoid throwing errors in the tree view
    return createContextValue(contextValues) + `;${randomUUID()}`;
}

export async function tryCatchActivityWrapper(
    cb: () => void | Promise<void>,
    context: IActionContext & ExecuteActivityContext,
    success: ExecuteActivityOutput,
    fail: ExecuteActivityOutput,
    options: { shouldSwallowError?: boolean } = {}
): Promise<void> {
    try {
        await cb();
        success.item && context.activityChildren?.push(success.item);
        success.output && appendOutput(success.output);
    } catch (e) {
        fail.item && context.activityChildren?.push(fail.item);
        fail.output && appendOutput(fail.output);

        if (!options.shouldSwallowError) {
            throw e;
        }
    }

    function appendOutput(output: string | string[]): void {
        output = Array.isArray(output) ? output : [output];

        for (const log of output) {
            ext.outputChannel.appendLog(log);
        }
    }
}
