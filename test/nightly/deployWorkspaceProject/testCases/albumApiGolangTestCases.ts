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

export function generateAlbumApiGolangTestCases(): DeployWorkspaceProjectTestCase[] {
    const folderName: string = 'albumapi-go';
    const appResourceName: string = 'album-api';
    const sharedResourceName: string = appResourceName + randomUtils.getRandomHexString(4);
    const acrResourceName: string = sharedResourceName.replace(/[^a-zA-Z0-9]+/g, '');

    return [
        {
            label: 'Deploy App',
            inputs: [
                new RegExp(folderName, 'i'),
                new RegExp('Create new container apps environment', 'i'),
                'Continue',
                sharedResourceName,
                appResourceName,
                `.${path.sep}src`,
                'East US',
                'Save'
            ],
            expectedResults: dwpTestUtils.generateExpectedResults(sharedResourceName, acrResourceName, appResourceName),
            expectedVSCodeSettings: {
                deploymentConfigurations: [
                    generateExpectedDeploymentConfiguration(sharedResourceName, acrResourceName, appResourceName)
                ]
            },
            postTestAssertion: dwpTestUtils.generatePostTestAssertion({ targetPort: 8080, env: undefined })
        },
        {
            label: 'Re-deploy App',
            inputs: [
                new RegExp(folderName, 'i'),
                appResourceName,
                'Continue'
            ],
            expectedResults: dwpTestUtils.generateExpectedResults(sharedResourceName, acrResourceName, appResourceName),
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
