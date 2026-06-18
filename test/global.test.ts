/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { registerAzureUtilsExtensionVariables } from '@microsoft/vscode-azext-azureutils';
import { registerOnActionStartHandler, testGlobalSetup, TestUserInput } from '@microsoft/vscode-azext-utils';
import * as vscode from 'vscode';
import { ext } from '../src/extensionVariables';
import { getTestApi } from './utils/testApiAccess';

export const longRunningLocalTestsEnabled: boolean = !/^(false|0)?$/i.test(process.env.AzCode_EnableLongRunningTestsLocal || '');
export const longRunningRemoteTestsEnabled: boolean = !!process.env.FC_SERVICE_CONNECTION_NAME
    || !/^(false|0)?$/i.test(process.env.AzCode_UseAzureFederatedCredentials || '');

export const longRunningTestsEnabled: boolean = longRunningLocalTestsEnabled || longRunningRemoteTestsEnabled;

// Runs before all tests
suiteSetup(async function (this: Mocha.Context): Promise<void> {
    this.timeout(2 * 60 * 1000);

    await getTestApi();
    Object.assign(ext, { prefix: 'containerApps', ...testGlobalSetup() });

    registerAzureUtilsExtensionVariables(ext);
    registerOnActionStartHandler(context => {
        // Use `TestUserInput` by default so we get an error if an unexpected call to `context.ui` occurs, rather than timing out
        context.ui = new TestUserInput(vscode);
    });
});
