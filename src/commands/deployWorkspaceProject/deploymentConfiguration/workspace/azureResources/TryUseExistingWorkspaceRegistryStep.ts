/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type Registry } from "@azure/arm-containerregistry";
import { AzureWizardExecuteStep, nonNullProp } from "@microsoft/vscode-azext-utils";
import { type Progress } from "vscode";
import { ext } from "../../../../../extensionVariables";
import { type SetTelemetryProps } from "../../../../../telemetry/SetTelemetryProps";
import { type DeployWorkspaceProjectTelemetryProps as TelemetryProps } from "../../../../../telemetry/deployWorkspaceProjectTelemetryProps";
import { localize } from "../../../../../utils/localize";
import { AcrListStep } from "../../../../registries/acr/AcrListStep";
import { type DeploymentConfigurationSettings } from "../../../settings/DeployWorkspaceProjectSettingsV2";
import { dwpSettingUtilsV2 } from "../../../settings/dwpSettingUtilsV2";
import { type WorkspaceDeploymentConfigurationContext } from "../WorkspaceDeploymentConfigurationContext";

type TryUseExistingWorkspaceRegistryContext = WorkspaceDeploymentConfigurationContext & SetTelemetryProps<TelemetryProps>;

export class TryUseExistingWorkspaceRegistryStep<T extends TryUseExistingWorkspaceRegistryContext> extends AzureWizardExecuteStep<T> {
    public priority: number = 220;  /** Todo: Figure out a good priority level */

    public async execute(context: T, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const settings: DeploymentConfigurationSettings[] | undefined = await dwpSettingUtilsV2.getWorkspaceDeploymentConfigurations(nonNullProp(context, 'rootFolder'));
        if (!settings?.length) {
            return;
        }

        if (context.deploymentConfigurationSettings) {
            // In the case where we were already verifying, it looks a little smoother if we keep the execution looking like a continuation of the previous step
            progress.report({ message: localize(`verifyingContainerRegistry`, 'Verifying container registry') });
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
                context.telemetry.properties.defaultedRegistry = 'true';
                ext.outputChannel.appendLog(localize('useExistingWorkspaceAcrSuccess', 'Searched workspace settings and found an existing container registry "{0}" to leverage.', context.registry?.name));
                break;
            }
        }

        context.telemetry.properties.defaultedRegistry = 'false';
    }

    public shouldExecute(context: T): boolean {
        return !context.registry;
    }
}
