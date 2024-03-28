/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ResourceGroup } from "@azure/arm-resources";
import { ResourceGroupListStep } from "@microsoft/vscode-azext-azureutils";
import { AzureResourceVerifyStepBase } from "./AzureResourceVerifyStepBase";
import { type WorkspaceDeploymentConfigurationContext } from "./WorkspaceDeploymentConfigurationContext";

export class ResourceGroupVerifyStep extends AzureResourceVerifyStepBase {
    public priority: number = 200;  /** Todo: Figure out a good priority level */

    protected resourceType = 'resource group' as const;
    protected deploymentSettingsKey: string = 'resourceGroup';
    protected contextKey: string = 'resourceGroup';

    protected async verifyResource(context: WorkspaceDeploymentConfigurationContext): Promise<void> {
        const resourceGroups: ResourceGroup[] = await ResourceGroupListStep.getResourceGroups(context);
        context.resourceGroup = resourceGroups.find(rg => rg.name === context.deploymentConfigurationSettings?.resourceGroup);
    }
}


