/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { randomUtils } from "@microsoft/vscode-azext-utils";
import * as path from "path";
import { DeploymentConfigurationSettings } from "../../../../../src/commands/deployWorkspaceProject/settings/DeployWorkspaceProjectSettingsV2";
import { type StringOrRegExpProps } from "../../../../typeUtils";
import { dwpTestUtils } from "../../dwpTestUtils";
import { type DeployWorkspaceProjectTestCase } from "../DeployWorkspaceProjectTestScenario";

export function generateMonorepoAdminCredentialsTests(): DeployWorkspaceProjectTestCase[] {
    const folderName: string = 'monorepo-admincreds';
    const sharedResourceName: string = 'monorepo-ac' + randomUtils.getRandomHexString(4);
    const acrResourceName: string = sharedResourceName.replace(/[^a-zA-Z0-9]+/g, '');

    const appOneName: string = 'monorepo-ac-app1';
    const appTwoName: string = 'monorepo-ac-app2';
    const appThreeName: string = 'monorepo-ac-app3';

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
                'Docker Login Credentials',
                'Enable',
                path.join('app1', 'Dockerfile'),
                `.${path.sep}app1`,
                `${appOneName}:latest`,
                path.join('app1', '.env.example'),
                'Continue',
                'Save'
            ],
            expectedResults: dwpTestUtils.generateExpectedResultsWithCredentials(sharedResourceName, acrResourceName, appOneName),
            expectedVSCodeSettings: {
                deploymentConfigurations: [
                    generateExpectedMonorepoDeploymentConfiguration(sharedResourceName, acrResourceName, appOneName, 'app1')
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
                'Docker Login Credentials',
                path.join('app2', 'Dockerfile'),
                `.${path.sep}app2`,
                `${appTwoName}:latest`,
                path.join('app2', '.env.example'),
                'Continue',
                'Save'
            ],
            expectedResults: dwpTestUtils.generateExpectedResultsWithCredentials(sharedResourceName, acrResourceName, appTwoName),
            expectedVSCodeSettings: {
                deploymentConfigurations: [
                    generateExpectedMonorepoDeploymentConfiguration(sharedResourceName, acrResourceName, appOneName, 'app1'),
                    generateExpectedMonorepoDeploymentConfiguration(sharedResourceName, acrResourceName, appTwoName, 'app2'),
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
                'Docker Login Credentials',
                path.join('app3', 'Dockerfile'),
                `.${path.sep}app3`,
                `${appThreeName}:latest`,
                path.join('app3', '.env.example'),
                'Continue',
                'Save'
            ],
            expectedResults: dwpTestUtils.generateExpectedResultsWithCredentials(sharedResourceName, acrResourceName, appThreeName),
            expectedVSCodeSettings: {
                deploymentConfigurations: [
                    generateExpectedMonorepoDeploymentConfiguration(sharedResourceName, acrResourceName, appOneName, 'app1'),
                    generateExpectedMonorepoDeploymentConfiguration(sharedResourceName, acrResourceName, appTwoName, 'app2'),
                    generateExpectedMonorepoDeploymentConfiguration(sharedResourceName, acrResourceName, appThreeName, 'app3'),
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
            expectedResults: dwpTestUtils.generateExpectedResultsWithCredentials(sharedResourceName, acrResourceName, appOneName),
            expectedVSCodeSettings: {
                deploymentConfigurations: [
                    generateExpectedMonorepoDeploymentConfiguration(sharedResourceName, acrResourceName, appOneName, 'app1'),
                    generateExpectedMonorepoDeploymentConfiguration(sharedResourceName, acrResourceName, appTwoName, 'app2'),
                    generateExpectedMonorepoDeploymentConfiguration(sharedResourceName, acrResourceName, appThreeName, 'app3'),
                ]
            },
            postTestAssertion: dwpTestUtils.generatePostTestAssertion({ targetPort: 3000, env: [{ name: 'MESSAGE', value: 'container apps (app1)' }] })
        }
    ];
}

export function generateExpectedMonorepoDeploymentConfiguration(sharedResourceName: string, acrResourceName: string, appResourceName: string, rootFolder: string): StringOrRegExpProps<DeploymentConfigurationSettings> {
    return {
        label: appResourceName,
        type: 'AcrDockerBuildRequest',
        dockerfilePath: path.join(rootFolder, 'Dockerfile'),
        srcPath: rootFolder,
        envPath: path.join(rootFolder, '.env.example'),
        resourceGroup: sharedResourceName,
        containerApp: appResourceName,
        containerRegistry: new RegExp(acrResourceName, 'i'),
    };
}
