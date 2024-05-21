/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { randomUtils } from "@microsoft/vscode-azext-utils";
import { type DeployWorkspaceProjectResults, type DeploymentConfigurationSettings } from "../../../extension.bundle";
import { type DeployWorkspaceProjectTestConfigurations } from "./DeployWorkspaceProjectTestConfigurations";
import { type StringOrRegExpProps } from "./StringOrRegExpProps";

export function getMonoRepoBasicTestConfigurations(): DeployWorkspaceProjectTestConfigurations {
    const sharedResourceName: string = 'monorepo-basic' + randomUtils.getRandomHexString(4);
    const acrResourceName: string = sharedResourceName.replace(/[^a-zA-Z0-9]+/g, '');

    return [
        {
            label: "App 1",
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
            expectedDotVSCodeSettings: {
                deploymentConfigurations: [
                    generateExpectedDeploymentConfiguration(sharedResourceName, acrResourceName, 'app1')
                ]
            }
        }
    ];
}

function generateExpectedResults(sharedResourceName: string, acrResourceName: string, appName: string): StringOrRegExpProps<DeployWorkspaceProjectResults> {
    return {
        containerAppId: new RegExp(`/resourceGroups/${sharedResourceName}/providers/Microsoft.App/containerApps/${appName}`, 'i'),
        imageName: new RegExp(appName, 'i'),
        logAnalyticsWorkspaceId: new RegExp(`/resourceGroups/${sharedResourceName}/providers/Microsoft.OperationalInsights/workspaces/${sharedResourceName}`, 'i'),
        managedEnvironmentId: new RegExp(`/resourceGroups/${sharedResourceName}/providers/Microsoft.App/managedEnvironments/${sharedResourceName}`, 'i'),
        registryId: new RegExp(`/resourceGroups/${sharedResourceName}/providers/Microsoft.ContainerRegistry/registries/${acrResourceName}.{6}`, 'i'),
        registryLoginServer: new RegExp(`${acrResourceName}.{6}.azurecr.io`, 'i'),
        registryPassword: new RegExp('.*'),
        registryUsername: new RegExp(`${acrResourceName}.{6}`, 'i'),
        resourceGroupId: new RegExp(`/resourceGroups/${sharedResourceName}`, 'i')
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
