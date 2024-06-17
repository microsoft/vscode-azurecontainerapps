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

export function generateMonoRepoBasicTestCases(): DeployWorkspaceProjectTestCase[] {
    const folderName: string = 'monorepo-basic';
    const sharedResourceName: string = 'monorepo-basic' + randomUtils.getRandomHexString(4);
    const acrResourceName: string = sharedResourceName.replace(/[^a-zA-Z0-9]+/g, '');

    return [
        {
            label: "Deploy App 1",
            inputs: [
                new RegExp(folderName, 'i'),
                path.join('app1', 'Dockerfile'),
                new RegExp('Create new container apps environment', 'i'),
                'Continue',
                sharedResourceName,
                'app1',
                `.${path.sep}app1`,
                path.join('app1', '.env.example'),
                'East US',
                'Save'
            ],
            expectedResults: dwpTestUtils.generateExpectedResults(sharedResourceName, acrResourceName, 'app1'),
            expectedVSCodeSettings: {
                deploymentConfigurations: [
                    generateExpectedDeploymentConfiguration(sharedResourceName, acrResourceName, 'app1')
                ]
            },
            postTestAssertion: dwpTestUtils.generatePostTestAssertion({ targetPort: 3000, env: [{ name: 'MESSAGE', value: 'container apps (app1)' }] })
        },
        {
            label: "Deploy App 2",
            inputs: [
                new RegExp(folderName, 'i'),
                new RegExp('Create and deploy new app configuration', 'i'),
                path.join('app2', 'Dockerfile'),
                new RegExp('(Recommended)', 'i'), // Select a container app environment
                'Continue',
                'app2',
                `.${path.sep}app2`,
                path.join('app2', '.env.example'),
                'Save'
            ],
            expectedResults: dwpTestUtils.generateExpectedResults(sharedResourceName, acrResourceName, 'app2'),
            expectedVSCodeSettings: {
                deploymentConfigurations: [
                    generateExpectedDeploymentConfiguration(sharedResourceName, acrResourceName, 'app1'),
                    generateExpectedDeploymentConfiguration(sharedResourceName, acrResourceName, 'app2'),
                ]
            },
            postTestAssertion: dwpTestUtils.generatePostTestAssertion({ targetPort: 3001, env: [{ name: 'MESSAGE', value: 'container apps (app2)' }] })
        },
        {
            label: "Deploy App 3",
            inputs: [
                new RegExp(folderName, 'i'),
                new RegExp('Create and deploy new app configuration', 'i'),
                path.join('app3', 'Dockerfile'),
                new RegExp('(Recommended)', 'i'), // Select a container app environment
                'Continue',
                'app3',
                `.${path.sep}app3`,
                path.join('app3', '.env.example'),
                'Save'
            ],
            expectedResults: dwpTestUtils.generateExpectedResults(sharedResourceName, acrResourceName, 'app3'),
            expectedVSCodeSettings: {
                deploymentConfigurations: [
                    generateExpectedDeploymentConfiguration(sharedResourceName, acrResourceName, 'app1'),
                    generateExpectedDeploymentConfiguration(sharedResourceName, acrResourceName, 'app2'),
                    generateExpectedDeploymentConfiguration(sharedResourceName, acrResourceName, 'app3'),
                ]
            },
            postTestAssertion: dwpTestUtils.generatePostTestAssertion({ targetPort: 3002, env: [{ name: 'MESSAGE', value: 'container apps (app3)' }] })
        },
        {
            label: "Re-deploy App 1",
            inputs: [
                new RegExp(folderName, 'i'),
                'app1',
                'Continue'
            ],
            expectedResults: dwpTestUtils.generateExpectedResults(sharedResourceName, acrResourceName, 'app1'),
            expectedVSCodeSettings: {
                deploymentConfigurations: [
                    generateExpectedDeploymentConfiguration(sharedResourceName, acrResourceName, 'app1'),
                    generateExpectedDeploymentConfiguration(sharedResourceName, acrResourceName, 'app2'),
                    generateExpectedDeploymentConfiguration(sharedResourceName, acrResourceName, 'app3'),
                ]
            },
            postTestAssertion: dwpTestUtils.generatePostTestAssertion({ targetPort: 3000, env: [{ name: 'MESSAGE', value: 'container apps (app1)' }] })
        }
    ];
}

function generateExpectedDeploymentConfiguration(sharedResourceName: string, acrResourceName: string, appResourceName: string): StringOrRegExpProps<DeploymentConfigurationSettings> {
    return {
        label: appResourceName,
        type: 'AcrDockerBuildRequest',
        dockerfilePath: path.join(appResourceName, 'Dockerfile'),
        srcPath: appResourceName,
        envPath: path.join(appResourceName, '.env.example'),
        resourceGroup: sharedResourceName,
        containerApp: appResourceName,
        containerRegistry: new RegExp(`${acrResourceName}.{6}`, 'i'),
    };
}
