/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ContainerApp, type EnvironmentVar } from "@azure/arm-appcontainers";
import { parseAzureResourceId } from "@microsoft/vscode-azext-azureutils";
import { type AzureSubscription } from "@microsoft/vscode-azureresources-api";
import * as assert from "assert";
import { createContainerAppsAPIClient, createSubscriptionContext, ext, nonNullProp, subscriptionExperience, type DeployWorkspaceProjectResults, type IActionContext, type ISubscriptionContext } from "../../extension.bundle";
import { type StringOrRegExpProps } from "../typeUtils";
import { type PostTestAssertion } from "./testCases/DeployWorkspaceProjectTestCase";

export namespace dwpTestUtils {
    export function generateExpectedResults(sharedResourceName: string, acrResourceName: string, appName: string): StringOrRegExpProps<DeployWorkspaceProjectResults> {
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
}
