/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type IActionContext } from "@microsoft/vscode-azext-utils";

/**
 * Canary property used to identify contexts originating from Copilot,
 * avoiding reliance on `instanceof CopilotUserInput` checks.
 */
const copilotUserInputCanaryKey = '_copilotUserInput';

export function isCopilotUserInput(context: IActionContext): boolean {
    return !!(context as unknown as Record<string, unknown>)[copilotUserInputCanaryKey];
}

export function markAsCopilotUserInput(context: IActionContext): void {
    (context as unknown as Record<string, unknown>)[copilotUserInputCanaryKey] = true;
}
