/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { TestOutputChannel, TestUserInput } from '@microsoft/vscode-azext-dev';
import * as assert from 'assert';
import * as vscode from 'vscode';
import { ext, registerOnActionStartHandler } from '../extension.bundle';

export let longRunningTestsEnabled: boolean;

// Runs before all tests
suiteSetup(async function (this: Mocha.Context): Promise<void> {
    this.timeout(1 * 60 * 1000);

    const extension = vscode.extensions.getExtension('ms-azuretools.vscode-azurecontainerapps');
    if (!extension) {
        assert.fail('Failed to find extension.');
    } else {
        await extension.activate();
    }

    registerOnActionStartHandler(context => {
        // Use `TestUserInput` by default so we get an error if an unexpected call to `context.ui` occurs, rather than timing out
        context.ui = new TestUserInput(vscode);
    });

    ext.outputChannel = new TestOutputChannel();
    longRunningTestsEnabled = /true/i.test(process.env.AzCode_EnableLongRunningTests ?? '');

    const useAzureFederatedCredentials = /true/i.test(process.env.AzCode_UseAzureFederatedCredentials ?? '');
    console.log("enable long running tests: ", String(longRunningTestsEnabled));
    console.log("use azure federated credentials: ", String(useAzureFederatedCredentials));
});
