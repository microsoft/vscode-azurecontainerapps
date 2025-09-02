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

    const appOneName: string = 'monorepo-id-app1';
    const appTwoName: string = 'monorepo-id-app2';
    const appThreeName: string = 'monorepo-id-app3';

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
                appOneName,
                'East US',
                'Managed Identity',
                path.join('app1', 'Dockerfile'),
                `.${path.sep}app1`,
                `${appOneName}:latest`,
                path.join('app1', '.env.example'),
                'Continue',
                'Save'
            ],
            expectedResults: dwpTestUtils.generateExpectedResultsWithoutCredentials(sharedResourceName, acrResourceName, appOneName),
            expectedVSCodeSettings: {
                deploymentConfigurations: [
                    generateExpectedDeploymentConfiguration(sharedResourceName, acrResourceName, appOneName)
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
                appTwoName,
                'Managed Identity',
                path.join('app2', 'Dockerfile'),
                `.${path.sep}app2`,
                `${appTwoName}:latest`,
                path.join('app2', '.env.example'),
                'Continue',
                'Save'
            ],
            expectedResults: dwpTestUtils.generateExpectedResultsWithoutCredentials(sharedResourceName, acrResourceName, appTwoName),
            expectedVSCodeSettings: {
                deploymentConfigurations: [
                    generateExpectedDeploymentConfiguration(sharedResourceName, acrResourceName, appOneName),
                    generateExpectedDeploymentConfiguration(sharedResourceName, acrResourceName, appTwoName),
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
                appThreeName,
                'Managed Identity',
                path.join('app3', 'Dockerfile'),
                `.${path.sep}app3`,
                `${appThreeName}:latest`,
                path.join('app3', '.env.example'),
                'Continue',
                'Save'
            ],
            expectedResults: dwpTestUtils.generateExpectedResultsWithoutCredentials(sharedResourceName, acrResourceName, appThreeName),
            expectedVSCodeSettings: {
                deploymentConfigurations: [
                    generateExpectedDeploymentConfiguration(sharedResourceName, acrResourceName, appOneName),
                    generateExpectedDeploymentConfiguration(sharedResourceName, acrResourceName, appTwoName),
                    generateExpectedDeploymentConfiguration(sharedResourceName, acrResourceName, appThreeName),
                ]
            },
            postTestAssertion: dwpTestUtils.generatePostTestAssertion({ targetPort: 3002, env: [{ name: 'MESSAGE', value: 'container apps (app3)' }] }),
        },
        {
            label: "Re-deploy App 1",
            inputs: [
                new RegExp(folderName, 'i'),
                appOneName,
                'Continue'
            ],
            expectedResults: dwpTestUtils.generateExpectedResultsWithoutCredentials(sharedResourceName, acrResourceName, appOneName),
            expectedVSCodeSettings: {
                deploymentConfigurations: [
                    generateExpectedDeploymentConfiguration(sharedResourceName, acrResourceName, appOneName),
                    generateExpectedDeploymentConfiguration(sharedResourceName, acrResourceName, appTwoName),
                    generateExpectedDeploymentConfiguration(sharedResourceName, acrResourceName, appThreeName),
                ]
            },
            postTestAssertion: dwpTestUtils.generatePostTestAssertion({ targetPort: 3000, env: [{ name: 'MESSAGE', value: 'container apps (app1)' }] })
        }
    ];
}
