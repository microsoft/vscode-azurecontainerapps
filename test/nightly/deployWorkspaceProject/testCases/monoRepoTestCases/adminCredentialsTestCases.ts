/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { randomUtils } from "@microsoft/vscode-azext-utils";
import * as path from "path";
import { dwpTestUtils } from "../../dwpTestUtils";
import { type DeployWorkspaceProjectTestCase } from "../DeployWorkspaceProjectTestCase";
import { generateExpectedDeploymentConfiguration } from "./generateExpectedDeploymentConfiguration";

export function generateMonoRepoAdminCredentialsTestCases(): DeployWorkspaceProjectTestCase[] {
    const folderName: string = 'monorepo-admincreds';
    const sharedResourceName: string = 'monorepo-ac' + randomUtils.getRandomHexString(4);
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
                'Docker Login Credentials',
                'Enable',
                path.join('app1', '.env.example'),
                'East US',
                'Save'
            ],
            expectedResults: dwpTestUtils.generateExpectedResultsWithCredentials(sharedResourceName, acrResourceName, 'app1'),
            expectedVSCodeSettings: {
                deploymentConfigurations: [
                    generateExpectedDeploymentConfiguration(sharedResourceName, acrResourceName, 'app1')
                ]
            },
            postTestAssertion: dwpTestUtils.generatePostTestAssertion({ targetPort: 3000, env: [{ name: 'MESSAGE', value: 'container apps (app1)' }] }),
            resourceGroupToDelete: sharedResourceName
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
                'Docker Login Credentials',
                path.join('app2', '.env.example'),
                'Save'
            ],
            expectedResults: dwpTestUtils.generateExpectedResultsWithCredentials(sharedResourceName, acrResourceName, 'app2'),
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
                'Docker Login Credentials',
                path.join('app3', '.env.example'),
                'Save'
            ],
            expectedResults: dwpTestUtils.generateExpectedResultsWithCredentials(sharedResourceName, acrResourceName, 'app3'),
            expectedVSCodeSettings: {
                deploymentConfigurations: [
                    generateExpectedDeploymentConfiguration(sharedResourceName, acrResourceName, 'app1'),
                    generateExpectedDeploymentConfiguration(sharedResourceName, acrResourceName, 'app2'),
                    generateExpectedDeploymentConfiguration(sharedResourceName, acrResourceName, 'app3'),
                ]
            },
            postTestAssertion: dwpTestUtils.generatePostTestAssertion({ targetPort: 3002, env: [{ name: 'MESSAGE', value: 'container apps (app3)' }] }),
        },
        {
            label: "Re-deploy App 1",
            inputs: [
                new RegExp(folderName, 'i'),
                'app1',
                'Continue'
            ],
            expectedResults: dwpTestUtils.generateExpectedResultsWithCredentials(sharedResourceName, acrResourceName, 'app1'),
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
