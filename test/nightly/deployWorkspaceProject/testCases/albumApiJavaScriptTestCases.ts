/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { randomUtils } from "@microsoft/vscode-azext-utils";
import * as path from "path";
import { type DeploymentConfigurationSettings } from "../../../../extension.bundle";
import { type StringOrRegExpProps } from "../../../typeUtils";
import { dwpTestUtils } from "../dwpTestUtils";
import { type DeployWorkspaceProjectTestCase } from "./DeployWorkspaceProjectTestCase";

export function generateAlbumApiJavaScriptTestCases(): DeployWorkspaceProjectTestCase[] {
    const folderName: string = 'albumapi-js';
    const appResourceName: string = 'album-api';
    const sharedResourceName: string = 'album-js' + randomUtils.getRandomHexString(4);
    const acrResourceName: string = sharedResourceName.replace(/[^a-zA-Z0-9]+/g, '');

    return [
        {
            label: 'Should fail to deploy app (bad Dockerfile)',
            inputs: [
                new RegExp(folderName, 'i'),
                path.join('src', 'test_fail.Dockerfile'),
                new RegExp('Create new container apps environment', 'i'),
                new RegExp('Create new container registry', 'i'),
                'Continue',
                sharedResourceName.slice(0, -1), // Isolate by using a different resource group name since we expect this case to fail
                appResourceName,
                `.${path.sep}src`,
                'Docker Login Credentials',
                'Enable',
                'East US',
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
                path.join('src', 'Dockerfile'),
                new RegExp('Create new container apps environment', 'i'),
                new RegExp('Create new container registry', 'i'),
                'Continue',
                sharedResourceName,
                appResourceName,
                `.${path.sep}src`,
                'Docker Login Credentials',
                'Enable',
                'East US',
                'Save'
            ],
            expectedResults: dwpTestUtils.generateExpectedResultsWithCredentials(sharedResourceName, acrResourceName, appResourceName),
            expectedVSCodeSettings: {
                deploymentConfigurations: [
                    generateExpectedDeploymentConfiguration(sharedResourceName, acrResourceName, appResourceName)
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
                    generateExpectedDeploymentConfiguration(sharedResourceName, acrResourceName, appResourceName)
                ]
            },
            postTestAssertion: dwpTestUtils.generatePostTestAssertion({ targetPort: 8080, env: undefined })
        }
    ];
}

function generateExpectedDeploymentConfiguration(sharedResourceName: string, acrResourceName: string, appResourceName: string): StringOrRegExpProps<DeploymentConfigurationSettings> {
    return {
        label: appResourceName,
        type: 'AcrDockerBuildRequest',
        dockerfilePath: path.join('src', 'Dockerfile'),
        srcPath: 'src',
        envPath: '',
        resourceGroup: sharedResourceName,
        containerApp: appResourceName,
        containerRegistry: new RegExp(`${acrResourceName}.{6}`, 'i'),
    };
}
