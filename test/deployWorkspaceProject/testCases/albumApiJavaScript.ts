/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { randomUtils } from "@microsoft/vscode-azext-utils";
import { type DeployWorkspaceProjectTestCase } from "./DeployWorkspaceProjectTestCase";

export function generateAlbumApiJavaScriptTestCases(): DeployWorkspaceProjectTestCase[] {
    const sharedResourceName: string = 'album-api' + randomUtils.getRandomHexString(4);
    // const acrResourceName: string = sharedResourceName.replace(/[^a-zA-Z0-9]+/g, '');

    return [
        {
            label: 'Deploy App',
            inputs: [
                new RegExp('albumapi-javascript', 'i'),
                new RegExp('Create new container apps environment', 'i'),
                'Continue',
                sharedResourceName,
                'album-api',
                './src',
                'East US',
                'Save'
            ],
            expectedResults: {},
            expectedVSCodeSettings: {},
        }
    ];
}
