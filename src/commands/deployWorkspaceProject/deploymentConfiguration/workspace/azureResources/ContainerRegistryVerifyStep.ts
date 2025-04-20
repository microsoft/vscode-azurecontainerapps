/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type Registry } from "@azure/arm-containerregistry";
import { AcrListStep } from "../../../../image/imageSource/containerRegistry/acr/AcrListStep";
import { type WorkspaceDeploymentConfigurationContext } from "../WorkspaceDeploymentConfigurationContext";
import { AzureResourceVerifyStepBase } from "./AzureResourceVerifyStepBase";

export class ContainerRegistryVerifyStep extends AzureResourceVerifyStepBase<WorkspaceDeploymentConfigurationContext> {
    public priority: number = 210;  /** Todo: Figure out a good priority level */

    protected resourceType = 'container registry' as const;
    protected deploymentSettingsKey = 'containerRegistry' as const;
    protected contextKey = 'registry' as const;

    protected async verifyResource(context: WorkspaceDeploymentConfigurationContext): Promise<void> {
        const registries: Registry[] = await AcrListStep.getRegistries(context);
        context.registry = registries.find(r => r.name === context.deploymentConfigurationSettings?.containerRegistry);
    }
}



