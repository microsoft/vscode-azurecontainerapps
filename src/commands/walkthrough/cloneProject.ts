/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { commands } from "vscode";

export async function cloneProject(): Promise<void> {
    await commands.executeCommand('git.clone');
    await commands.executeCommand('workbench.view.explorer');
    await commands.executeCommand('setContext', 'containerApps.isSampleProject', true);
}
