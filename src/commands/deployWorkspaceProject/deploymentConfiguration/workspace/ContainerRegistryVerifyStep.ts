/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type Registry } from "@azure/arm-containerregistry";
import { AcrListStep } from "../../../image/imageSource/containerRegistry/acr/AcrListStep";
import { AzureResourceVerifyStepBase } from "./AzureResourceVerifyStepBase";
import { type WorkspaceDeploymentConfigurationContext } from "./WorkspaceDeploymentConfigurationContext";

export class ContainerRegistryVerifyStep extends AzureResourceVerifyStepBase {
    public priority: number = 210;  /** Todo: Figure out a good priority level */

    protected resourceType = 'container registry' as const;
    protected deploymentSettingsKey: string = 'containerRegistry';
    protected contextKey: string = 'registry';

    protected async verifyResource(context: WorkspaceDeploymentConfigurationContext): Promise<void> {
        const registries: Registry[] = await AcrListStep.getRegistries(context);
        context.registry = registries.find(r => r.name === context.deploymentConfigurationSettings?.containerRegistry);
    }
}



