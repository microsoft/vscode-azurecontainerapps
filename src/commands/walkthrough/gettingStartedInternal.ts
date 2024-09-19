/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { commands } from 'vscode';

export async function gettingStartedInternalWalkthrough(): Promise<void> {
    await commands.executeCommand('workbench.action.openWalkthrough', 'ms-azuretools.vscode-azurecontainerapps#containerApps.walkthrough.gettingStarted', false);
}
