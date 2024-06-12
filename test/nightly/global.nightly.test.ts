/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { longRunningTestsEnabled } from '../global.test';

export const resourceGroupsToDelete: string[] = [];

// Runs before all nightly tests
suiteSetup(async function (this: Mocha.Context): Promise<void> {
    if (!longRunningTestsEnabled) {
        return;
    }

    this.timeout(2 * 60 * 1000);
    console.log('Long running tests enabled')
    console.log('Logging in via resource groups...')
    await vscode.commands.executeCommand('azureResourceGroups.logIn');
    console.log('Finished logging in.')
});
