/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { randomUtils } from "@microsoft/vscode-azext-utils";
import * as path from "path";
import { dwpTestUtils } from "../dwpTestUtils";
import { type DeployWorkspaceProjectTestCase } from "./DeployWorkspaceProjectTestCase";

export function generateAdvancedJSTestCases(): DeployWorkspaceProjectTestCase[] {
    const folderName: string = 'advanced-js';
    const appResourceName: string = 'a-js-app';
    const sharedResourceName: string = 'a-js-env' + randomUtils.getRandomHexString(4);
    const acrResourceName: string = sharedResourceName.replace(/[^a-zA-Z0-9]+/g, '');

    return [
        {
            label: 'Deploy App',
            inputs: [
                new RegExp(folderName, 'i'),
                'Advanced',
                new RegExp('Create new container apps environment', 'i'),
                sharedResourceName,
                new RegExp('Create new resource group', 'i'),
                sharedResourceName,
                new RegExp('Create new container registry', 'i'),
                acrResourceName,
                'Standard',
                new RegExp('Create new container app'),
                appResourceName,
                'East US',
                'Docker Login Credentials',
                'Enable',
                path.join('src', 'Dockerfile'),
                `.${path.sep}src`,
                `${appResourceName}:latest`,
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
