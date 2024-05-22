/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { randomUtils } from "@microsoft/vscode-azext-utils";
import { type DeployWorkspaceProjectResults, type DeploymentConfigurationSettings } from "../../../extension.bundle";
import { type StringOrRegExpProps } from "../../StringOrRegExpProps";
import { type DeployWorkspaceProjectTestCases } from "./DeployWorkspaceProjectTestCases";

export function getMonoRepoBasicTestCases(): DeployWorkspaceProjectTestCases {
    const sharedResourceName: string = 'monorepo-basic' + randomUtils.getRandomHexString(4);
    const acrResourceName: string = sharedResourceName.replace(/[^a-zA-Z0-9]+/g, '');

    return [
        {
            label: "Deploy App 1",
            inputs: [
                'app1/Dockerfile',
                new RegExp('Create new container apps environment', 'i'),
                'Continue',
                sharedResourceName,
                'app1',
                './app1',
                'app1/.env.example',
                'East US',
                'Save'
            ],
            expectedResults: generateExpectedResults(sharedResourceName, acrResourceName, 'app1'),
            expectedVSCodeWorkspaceSettings: {
                deploymentConfigurations: [
                    generateExpectedDeploymentConfiguration(sharedResourceName, acrResourceName, 'app1')
                ]
            }
        },
        {
            label: "Deploy App 2",
            inputs: [
                new RegExp('Create and deploy new app configuration', 'i'),
                'app2/Dockerfile',
                new RegExp('(Recommended)', 'i'), // Select a container app environment
                'Continue',
                'app2',
                './app2',
                'app2/.env.example',
                'Save'
            ],
            expectedResults: generateExpectedResults(sharedResourceName, acrResourceName, 'app2'),
            expectedVSCodeWorkspaceSettings: {
                deploymentConfigurations: [
                    generateExpectedDeploymentConfiguration(sharedResourceName, acrResourceName, 'app1'),
                    generateExpectedDeploymentConfiguration(sharedResourceName, acrResourceName, 'app2'),
                ]
            }
        },
        {
            label: "Deploy App 3",
            inputs: [
                new RegExp('Create and deploy new app configuration', 'i'),
                'app3/Dockerfile',
                new RegExp('(Recommended)', 'i'), // Select a container app environment
                'Continue',
                'app3',
                './app3',
                'app3/.env.example',
                'Save'
            ],
            expectedResults: generateExpectedResults(sharedResourceName, acrResourceName, 'app3'),
            expectedVSCodeWorkspaceSettings: {
                deploymentConfigurations: [
                    generateExpectedDeploymentConfiguration(sharedResourceName, acrResourceName, 'app1'),
                    generateExpectedDeploymentConfiguration(sharedResourceName, acrResourceName, 'app2'),
                    generateExpectedDeploymentConfiguration(sharedResourceName, acrResourceName, 'app3'),
                ]
            }
        },
        {
            label: "Re-deploy App 1",
            inputs: [
                'app1',
                'Continue'
            ],
            expectedResults: generateExpectedResults(sharedResourceName, acrResourceName, 'app1'),
            expectedVSCodeWorkspaceSettings: {
                deploymentConfigurations: [
                    generateExpectedDeploymentConfiguration(sharedResourceName, acrResourceName, 'app1'),
                    generateExpectedDeploymentConfiguration(sharedResourceName, acrResourceName, 'app2'),
                    generateExpectedDeploymentConfiguration(sharedResourceName, acrResourceName, 'app3'),
                ]
            }
        }
    ];
}

function generateExpectedResults(sharedResourceName: string, acrResourceName: string, appName: string): StringOrRegExpProps<DeployWorkspaceProjectResults> {
    return {
        containerAppId: new RegExp(`\/resourceGroups\/${sharedResourceName}\/providers\/Microsoft\.App\/containerApps\/${appName}`, 'i'),
        imageName: new RegExp(appName, 'i'),
        logAnalyticsWorkspaceId: new RegExp(`\/resourceGroups\/${sharedResourceName}\/providers\/Microsoft\.OperationalInsights\/workspaces\/${sharedResourceName}`, 'i'),
        managedEnvironmentId: new RegExp(`\/resourceGroups\/${sharedResourceName}\/providers\/Microsoft\.App\/managedEnvironments\/${sharedResourceName}`, 'i'),
        registryId: new RegExp(`\/resourceGroups\/${sharedResourceName}\/providers\/Microsoft\.ContainerRegistry\/registries\/${acrResourceName}.{6}`, 'i'),
        registryLoginServer: new RegExp(`${acrResourceName}.{6}\.azurecr\.io`, 'i'),
        registryPassword: new RegExp('.*'),
        registryUsername: new RegExp(`${acrResourceName}.{6}`, 'i'),
        resourceGroupId: new RegExp(`\/resourceGroups\/${sharedResourceName}`, 'i')
    };
}

function generateExpectedDeploymentConfiguration(sharedResourceName: string, acrResourceName: string, appName: string): StringOrRegExpProps<DeploymentConfigurationSettings> {
    return {
        label: appName,
        type: 'AcrDockerBuildRequest',
        dockerfilePath: `${appName}/Dockerfile`,
        srcPath: appName,
        envPath: `${appName}/.env.example`,
        resourceGroup: sharedResourceName,
        containerApp: appName,
        containerRegistry: new RegExp(`${acrResourceName}.{6}`, 'i'),
    };
}

export async function postTestAssertion(_: DeployWorkspaceProjectResults): Promise<void> {
    // Check container app environment variables
    // Check dockerfile ingress
    // Check container image
}
