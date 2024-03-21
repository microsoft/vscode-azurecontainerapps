/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type Registry } from "@azure/arm-containerregistry";
import { GenericTreeItem, activitySuccessContext, activitySuccessIcon, nonNullProp } from "@microsoft/vscode-azext-utils";
import { type Progress } from "vscode";
import { ExecuteActivityOutputStepBase, type ExecuteActivityOutput } from "../../../../utils/activity/ExecuteActivityOutputStepBase";
import { createActivityChildContext } from "../../../../utils/activity/activityUtils";
import { localize } from "../../../../utils/localize";
import { AcrListStep } from "../../../image/imageSource/containerRegistry/acr/AcrListStep";
import { type DeploymentConfigurationSettings } from "../../settings/DeployWorkspaceProjectSettingsV2";
import { dwpSettingUtilsV2 } from "../../settings/dwpSettingUtilsV2";
import { type WorkspaceDeploymentConfigurationContext } from "./WorkspaceDeploymentConfigurationContext";

export class TryUseExistingWorkspaceContainerRegistryStep extends ExecuteActivityOutputStepBase<WorkspaceDeploymentConfigurationContext> {
    public priority: number = 220;  /** Todo: Figure out a good priority level */

    protected configurationLabel?: string;

    protected async executeCore(context: WorkspaceDeploymentConfigurationContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        this.options.shouldSwallowError = true;

        const settings: DeploymentConfigurationSettings[] | undefined = await dwpSettingUtilsV2.getWorkspaceDeploymentConfigurations(nonNullProp(context, 'rootFolder'));
        if (!settings?.length) {
            return;
        }

        progress.report({ message: localize('searchingRegistries', 'Searching for available registry...') });

        const registries: Registry[] = await AcrListStep.getRegistries(context);
        const registryMap: Map<string, Registry> = new Map();

        for (const registry of registries) {
            if (!registry.name) {
                continue;
            }
            registryMap.set(registry.name, registry);
        }

        for (const [i, setting] of settings.entries()) {
            if (!setting.containerRegistry) {
                continue;
            }

            if (registryMap.has(setting.containerRegistry)) {
                context.registry = registryMap.get(setting.containerRegistry);
                this.configurationLabel = settings[i].label || 'Unnamed app';
                break;
            }
        }

        if (!context.registry) {
            throw new Error(localize('noAvailableRegistry', 'Unable to find a valid workspace container registry to leverage.'));
        }
    }

    public shouldExecute(context: WorkspaceDeploymentConfigurationContext): boolean {
        return !context.registry;
    }

    protected createSuccessOutput(context: WorkspaceDeploymentConfigurationContext): ExecuteActivityOutput {
        return {
            item: new GenericTreeItem(undefined, {
                contextValue: createActivityChildContext(['tryUseExistingWorkspaceAcrStepSuccessItem', activitySuccessContext]),
                label: localize('useExistingWorkspaceAcrSuccessLabel', 'Use available container registry "{0}" from configuration "{1}"', context.registry?.name, this.configurationLabel),
                iconPath: activitySuccessIcon,
            }),
            message: localize('useExistingWorkspaceAcrSuccess', 'Using an available container registry "{0}" from configuration "{1}".', context.registry?.name, this.configurationLabel)
        };
    }

    protected createFailOutput(_: WorkspaceDeploymentConfigurationContext): ExecuteActivityOutput {
        // We don't need to show the user any output if this step fails
        return {};
    }
}
