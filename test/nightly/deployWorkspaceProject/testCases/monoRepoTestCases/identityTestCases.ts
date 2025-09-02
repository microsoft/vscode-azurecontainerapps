/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { randomUtils } from "@microsoft/vscode-azext-utils";
import * as path from "path";
import { dwpTestUtils } from "../../dwpTestUtils";
import { type DeployWorkspaceProjectTestCase } from "../DeployWorkspaceProjectTestCase";
import { generateExpectedDeploymentConfiguration } from "./generateExpectedDeploymentConfiguration";

export function generateMonoRepoIdentityTestCases(): DeployWorkspaceProjectTestCase[] {
    const folderName: string = 'monorepo-identity';
    const sharedResourceName: string = 'monorepo-id' + randomUtils.getRandomHexString(4);
    const acrResourceName: string = sharedResourceName.replace(/[^a-zA-Z0-9]+/g, '');

    return [
        {
            label: "Deploy App 1",
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
                'app1',
                'East US',
                'Managed Identity',
                path.join('app1', 'Dockerfile'),
                `.${path.sep}app1`,
                'app1:latest',
                path.join('app1', '.env.example'),
                'Continue',
                'Save'
            ],
            expectedResults: dwpTestUtils.generateExpectedResultsWithoutCredentials(sharedResourceName, acrResourceName, 'app1'),
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
                'Advanced',
                sharedResourceName,
                acrResourceName,
                new RegExp('Create new container app'),
                'app2',
                'Managed Identity',
                path.join('app2', 'Dockerfile'),
                `.${path.sep}app2`,
                'app2:latest',
                path.join('app2', '.env.example'),
                'Continue',
                'Save'
            ],
            expectedResults: dwpTestUtils.generateExpectedResultsWithoutCredentials(sharedResourceName, acrResourceName, 'app2'),
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
                'Advanced',
                sharedResourceName,
                acrResourceName,
                new RegExp('Create new container app'),
                'app3',
                'Managed Identity',
                path.join('app3', 'Dockerfile'),
                `.${path.sep}app3`,
                'app3:latest',
                path.join('app3', '.env.example'),
                'Continue',
                'Save'
            ],
            expectedResults: dwpTestUtils.generateExpectedResultsWithoutCredentials(sharedResourceName, acrResourceName, 'app3'),
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
            expectedResults: dwpTestUtils.generateExpectedResultsWithoutCredentials(sharedResourceName, acrResourceName, 'app1'),
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
