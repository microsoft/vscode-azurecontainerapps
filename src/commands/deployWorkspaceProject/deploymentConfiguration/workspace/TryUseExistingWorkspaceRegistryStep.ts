/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type Registry } from "@azure/arm-containerregistry";
import { AzureWizardExecuteStep, nonNullProp } from "@microsoft/vscode-azext-utils";
import { type Progress } from "vscode";
import { ext } from "../../../../extensionVariables";
import { localize } from "../../../../utils/localize";
import { AcrListStep } from "../../../image/imageSource/containerRegistry/acr/AcrListStep";
import { type DeploymentConfigurationSettings } from "../../settings/DeployWorkspaceProjectSettingsV2";
import { dwpSettingUtilsV2 } from "../../settings/dwpSettingUtilsV2";
import { containerRegistryVerifyMessage } from "./ContainerRegistryVerifyStep";
import { type WorkspaceDeploymentConfigurationContext } from "./WorkspaceDeploymentConfigurationContext";

export class TryUseExistingWorkspaceRegistryStep extends AzureWizardExecuteStep<WorkspaceDeploymentConfigurationContext> {
    public priority: number = 220;  /** Todo: Figure out a good priority level */

    public async execute(context: WorkspaceDeploymentConfigurationContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const settings: DeploymentConfigurationSettings[] | undefined = await dwpSettingUtilsV2.getWorkspaceDeploymentConfigurations(nonNullProp(context, 'rootFolder'));
        if (!settings?.length) {
            return;
        }

        if (context.deploymentConfigurationSettings) {
            // In the case where we were already verifying, it looks a little smoother if we keep the execution looking like a continuation of that step
            progress.report({ message: containerRegistryVerifyMessage });
        } else {
            progress.report({ message: localize('searchingAvailableRegistries', 'Searching available registries...') });
        }

        const registries: Registry[] = await AcrListStep.getRegistries(context);
        const registryMap: Map<string, Registry> = new Map();

        for (const registry of registries) {
            if (!registry.name) {
                continue;
            }

            registryMap.set(registry.name, registry);
        }

        for (const setting of settings) {
            if (!setting.containerRegistry) {
                continue;
            }

            if (registryMap.has(setting.containerRegistry)) {
                context.registry = registryMap.get(setting.containerRegistry);
                ext.outputChannel.appendLog(localize('useExistingWorkspaceAcrSuccess', 'Searched workspace settings and found an existing container registry "{0}" to leverage.', context.registry?.name));
                break;
            }
        }
    }

    public shouldExecute(context: WorkspaceDeploymentConfigurationContext): boolean {
        return !context.registry;
    }
}
