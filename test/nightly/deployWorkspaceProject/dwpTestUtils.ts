/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ContainerApp, type EnvironmentVar } from "@azure/arm-appcontainers";
import { parseAzureResourceId } from "@microsoft/vscode-azext-azureutils";
import { nonNullProp, type IActionContext } from "@microsoft/vscode-azext-utils";
import * as assert from "assert";
import { createContainerAppsAPIClient, type DeployWorkspaceProjectResults } from "../../../extension.bundle";
import { type StringOrRegExpProps } from "../../typeUtils";
import { subscriptionContext } from "../global.nightly.test";
import { type PostTestAssertion } from "./scenarios/DeployWorkspaceProjectTestScenario";

export namespace dwpTestUtils {
    export function generateExpectedResultsWithCredentials(sharedResourceName: string, acrResourceName: string, appResourceName: string): StringOrRegExpProps<DeployWorkspaceProjectResults> {
        return {
            containerAppId: new RegExp(`\/resourceGroups\/${sharedResourceName}\/providers\/Microsoft\.App\/containerApps\/${appResourceName}`, 'i'),
            imageName: new RegExp(appResourceName, 'i'),
            logAnalyticsWorkspaceId: new RegExp(`\/resourceGroups\/${sharedResourceName}\/providers\/Microsoft\.OperationalInsights\/workspaces\/${sharedResourceName}`, 'i'),
            managedEnvironmentId: new RegExp(`\/resourceGroups\/${sharedResourceName}\/providers\/Microsoft\.App\/managedEnvironments\/${sharedResourceName}`, 'i'),
            registryId: new RegExp(`\/resourceGroups\/${sharedResourceName}\/providers\/Microsoft\.ContainerRegistry\/registries\/${acrResourceName}`, 'i'),
            registryLoginServer: new RegExp(`${acrResourceName}(?:.{6})?\.azurecr\.io`, 'i'),
            registryPassword: new RegExp('.*'),
            registryUsername: new RegExp(acrResourceName, 'i'),
            resourceGroupId: new RegExp(`\/resourceGroups\/${sharedResourceName}`, 'i')
        };
    }

    export function generateExpectedResultsWithoutCredentials(sharedResourceName: string, acrResourceName: string, appResourceName: string): StringOrRegExpProps<DeployWorkspaceProjectResults> {
        return {
            containerAppId: new RegExp(`\/resourceGroups\/${sharedResourceName}\/providers\/Microsoft\.App\/containerApps\/${appResourceName}`, 'i'),
            imageName: new RegExp(appResourceName, 'i'),
            logAnalyticsWorkspaceId: new RegExp(`\/resourceGroups\/${sharedResourceName}\/providers\/Microsoft\.OperationalInsights\/workspaces\/${sharedResourceName}`, 'i'),
            managedEnvironmentId: new RegExp(`\/resourceGroups\/${sharedResourceName}\/providers\/Microsoft\.App\/managedEnvironments\/${sharedResourceName}`, 'i'),
            registryId: new RegExp(`\/resourceGroups\/${sharedResourceName}\/providers\/Microsoft\.ContainerRegistry\/registries\/${acrResourceName}`, 'i'),
            registryLoginServer: new RegExp(`${acrResourceName}(?:.{6})?\.azurecr\.io`, 'i'),
            registryPassword: undefined,
            registryUsername: undefined,
            resourceGroupId: new RegExp(`\/resourceGroups\/${sharedResourceName}`, 'i')
        };
    }

    export function generatePostTestAssertion(expectedContainerAppSettings: { targetPort: number | undefined, env: EnvironmentVar[] | undefined }): PostTestAssertion {
        return async function postTestAssertion(context: IActionContext, resources: DeployWorkspaceProjectResults, errMsg?: string): Promise<void> {
            const parsedId = parseAzureResourceId(nonNullProp(resources, 'containerAppId'));
            const client = await createContainerAppsAPIClient(Object.assign(context, subscriptionContext));
            const containerApp: ContainerApp = await client.containerApps.get(parsedId.resourceGroup, parsedId.resourceName);

            assert.strictEqual(containerApp.configuration?.ingress?.targetPort, expectedContainerAppSettings.targetPort, errMsg ? errMsg + ' (container app target port)' : undefined);
            assert.strictEqual(containerApp.template?.containers?.[0].image, `${resources.registryLoginServer}/${resources.imageName}`, errMsg ? errMsg + ' (container image name)' : undefined);
            assert.deepStrictEqual(containerApp.template?.containers?.[0].env, expectedContainerAppSettings.env, errMsg ? errMsg + ' (container environment variables)' : undefined);
        }
    }
}
