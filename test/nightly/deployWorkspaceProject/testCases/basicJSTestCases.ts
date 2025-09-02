/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { randomUtils } from "@microsoft/vscode-azext-utils";
import * as path from "path";
import { dwpTestUtils } from "../dwpTestUtils";
import { type DeployWorkspaceProjectTestCase } from "./DeployWorkspaceProjectTestCase";

export function generateBasicJSTestCases(): DeployWorkspaceProjectTestCase[] {
    const folderName: string = 'basic-js';
    const appResourceName: string = 'b-js-app';
    const sharedResourceName: string = 'b-js-env' + randomUtils.getRandomHexString(4);
    const acrResourceName: string = sharedResourceName.replace(/[^a-zA-Z0-9]+/g, '');

    return [
        {
            label: 'Should fail to deploy app (bad Dockerfile)',
            inputs: [
                new RegExp(folderName, 'i'),
                'Basic',
                sharedResourceName,
                appResourceName,
                'East US',
                'Docker Login Credentials',
                'Enable',
                path.join('src', 'test_fail.Dockerfile'),
                `.${path.sep}src`,
                'Continue',
                'Save'
            ],
            expectedResults: undefined,
            expectedErrMsg: new RegExp('Failed to build image', 'i'),
            expectedVSCodeSettings: undefined,
            resourceGroupToDelete: sharedResourceName.slice(0, -1)
        },
        {
            label: 'Deploy App',
            inputs: [
                new RegExp(folderName, 'i'),
                'Basic',
                sharedResourceName,
                appResourceName,
                'East US',
                'Docker Login Credentials',
                'Enable',
                path.join('src', 'Dockerfile'),
                `.${path.sep}src`,
                'Continue',
                'Save'
            ],
            expectedResults: dwpTestUtils.generateExpectedResultsWithCredentials(sharedResourceName, acrResourceName, appResourceName),
            expectedVSCodeSettings: {
                deploymentConfigurations: [
                    dwpTestUtils.generateExpectedDeploymentConfiguration(sharedResourceName, acrResourceName, appResourceName)
                ]
            },
            postTestAssertion: dwpTestUtils.generatePostTestAssertion({ targetPort: 8080, env: undefined }),
            resourceGroupToDelete: sharedResourceName
        },
        {
            label: 'Re-deploy App',
            inputs: [
                new RegExp(folderName, 'i'),
                appResourceName,
                'Continue'
            ],
            expectedResults: dwpTestUtils.generateExpectedResultsWithCredentials(sharedResourceName, acrResourceName, appResourceName),
            expectedVSCodeSettings: {
                deploymentConfigurations: [
                    dwpTestUtils.generateExpectedDeploymentConfiguration(sharedResourceName, acrResourceName, appResourceName)
                ]
            },
            postTestAssertion: dwpTestUtils.generatePostTestAssertion({ targetPort: 8080, env: undefined })
        }
    ];
}
