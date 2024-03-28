/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ContainerApp, type ContainerAppsAPIClient } from "@azure/arm-appcontainers";
import { nonNullValueAndProp } from "@microsoft/vscode-azext-utils";
import { ContainerAppItem } from "../../../../tree/ContainerAppItem";
import { createContainerAppsAPIClient } from "../../../../utils/azureClients";
import { AzureResourceVerifyStepBase } from "./AzureResourceVerifyStepBase";
import { type WorkspaceDeploymentConfigurationContext } from "./WorkspaceDeploymentConfigurationContext";

export class ContainerAppVerifyStep extends AzureResourceVerifyStepBase {
    public priority: number = 205;  /** Todo: Figure out a good priority level */

    protected resourceType = 'container app' as const;
    protected deploymentSettingsKey: string = 'containerApp';
    protected contextKey: string = 'containerApp';

    protected async verifyResource(context: WorkspaceDeploymentConfigurationContext): Promise<void> {
        const client: ContainerAppsAPIClient = await createContainerAppsAPIClient(context);
        const containerApp: ContainerApp = await client.containerApps.get(nonNullValueAndProp(context.resourceGroup, 'name'), nonNullValueAndProp(context.deploymentConfigurationSettings, 'containerApp'));
        context.containerApp = ContainerAppItem.CreateContainerAppModel(containerApp);
    }
}
