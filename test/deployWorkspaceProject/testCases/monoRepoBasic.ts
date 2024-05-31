/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ContainerApp, type EnvironmentVar } from "@azure/arm-appcontainers";
import { parseAzureResourceId } from "@microsoft/vscode-azext-azureutils";
import { createSubscriptionContext, nonNullProp, randomUtils, subscriptionExperience, type IActionContext, type ISubscriptionContext } from "@microsoft/vscode-azext-utils";
import { type AzureSubscription } from "@microsoft/vscode-azureresources-api";
import * as assert from 'assert';
import { createContainerAppsAPIClient, ext, type DeployWorkspaceProjectResults, type DeploymentConfigurationSettings } from "../../../extension.bundle";
import { type StringOrRegExpProps } from "../../typeUtils";
import { type DeployWorkspaceProjectTestCase, type PostTestAssertion } from "./DeployWorkspaceProjectTestCase";

export function generateMonoRepoBasicTestCases(): DeployWorkspaceProjectTestCase[] {
    const sharedResourceName: string = 'monorepo-basic' + randomUtils.getRandomHexString(4);
    const acrResourceName: string = sharedResourceName.replace(/[^a-zA-Z0-9]+/g, '');

    return [
        {
            label: "Deploy App 1",
            inputs: [
                new RegExp('monorepo-basic', 'i'),
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
            expectedVSCodeSettings: {
                deploymentConfigurations: [
                    generateExpectedDeploymentConfiguration(sharedResourceName, acrResourceName, 'app1')
                ]
            },
            postTestAssertion: generatePostTestAssertion({ targetPort: 3000, env: [{ name: 'MESSAGE', value: 'container apps (app1)' }] })
        },
        {
            label: "Deploy App 2",
            inputs: [
                new RegExp('monorepo-basic', 'i'),
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
            expectedVSCodeSettings: {
                deploymentConfigurations: [
                    generateExpectedDeploymentConfiguration(sharedResourceName, acrResourceName, 'app1'),
                    generateExpectedDeploymentConfiguration(sharedResourceName, acrResourceName, 'app2'),
                ]
            },
            postTestAssertion: generatePostTestAssertion({ targetPort: 3001, env: [{ name: 'MESSAGE', value: 'container apps (app2)' }] })
        },
        {
            label: "Deploy App 3",
            inputs: [
                new RegExp('monorepo-basic', 'i'),
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
            expectedVSCodeSettings: {
                deploymentConfigurations: [
                    generateExpectedDeploymentConfiguration(sharedResourceName, acrResourceName, 'app1'),
                    generateExpectedDeploymentConfiguration(sharedResourceName, acrResourceName, 'app2'),
                    generateExpectedDeploymentConfiguration(sharedResourceName, acrResourceName, 'app3'),
                ]
            },
            postTestAssertion: generatePostTestAssertion({ targetPort: 3002, env: [{ name: 'MESSAGE', value: 'container apps (app3)' }] })
        },
        {
            label: "Re-deploy App 1",
            inputs: [
                new RegExp('monorepo-basic', 'i'),
                'app1',
                'Continue'
            ],
            expectedResults: generateExpectedResults(sharedResourceName, acrResourceName, 'app1'),
            expectedVSCodeSettings: {
                deploymentConfigurations: [
                    generateExpectedDeploymentConfiguration(sharedResourceName, acrResourceName, 'app1'),
                    generateExpectedDeploymentConfiguration(sharedResourceName, acrResourceName, 'app2'),
                    generateExpectedDeploymentConfiguration(sharedResourceName, acrResourceName, 'app3'),
                ]
            },
            postTestAssertion: generatePostTestAssertion({ targetPort: 3000, env: [{ name: 'MESSAGE', value: 'container apps (app1)' }] })
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

export function generatePostTestAssertion(expectedContainerAppSettings: { targetPort: number | undefined, env: EnvironmentVar[] | undefined }): PostTestAssertion {
    return async function postTestAssertion(context: IActionContext, resources: DeployWorkspaceProjectResults, errMsg?: string): Promise<void> {
        const parsedId = parseAzureResourceId(nonNullProp(resources, 'containerAppId'));

        const subscription: AzureSubscription = await subscriptionExperience(context, ext.rgApiV2.resources.azureResourceTreeDataProvider, {
            selectBySubscriptionId: parsedId.subscriptionId,
            showLoadingPrompt: false
        });
        const subscriptionContext: ISubscriptionContext = createSubscriptionContext(subscription);

        const client = await createContainerAppsAPIClient(Object.assign(context, subscriptionContext));
        const containerApp: ContainerApp = await client.containerApps.get(parsedId.resourceGroup, parsedId.resourceName);
        assert.strictEqual(containerApp.configuration?.ingress?.targetPort, expectedContainerAppSettings.targetPort, errMsg ? errMsg + ' (container app target port)' : undefined);
        assert.strictEqual(containerApp.template?.containers?.[0].image, `${resources.registryLoginServer}/${resources.imageName}`, errMsg ? errMsg + ' (container image name)' : undefined);
        assert.deepStrictEqual(containerApp.template?.containers?.[0].env, expectedContainerAppSettings.env, errMsg ? errMsg + ' (container environment variables)' : undefined);
    }
}
