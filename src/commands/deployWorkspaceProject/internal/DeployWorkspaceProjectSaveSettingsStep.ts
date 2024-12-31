/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardExecuteStep, GenericTreeItem, activityFailContext, activityFailIcon, activitySuccessContext, activitySuccessIcon, createUniversallyUniqueContextValue, nonNullProp, nonNullValueAndProp, type ExecuteActivityOutput } from "@microsoft/vscode-azext-utils";
import * as path from "path";
import { type Progress, type WorkspaceFolder } from "vscode";
import { relativeSettingsFilePath } from "../../../constants";
import { localize } from "../../../utils/localize";
import { useRemoteConfigurationKey } from "../deploymentConfiguration/workspace/filePaths/EnvUseRemoteConfigurationPromptStep";
import { type DeploymentConfigurationSettings } from "../settings/DeployWorkspaceProjectSettingsV2";
import { dwpSettingUtilsV2 } from "../settings/dwpSettingUtilsV2";
import { type DeployWorkspaceProjectInternalContext } from "./DeployWorkspaceProjectInternalContext";

const saveSettingsLabel: string = localize('saveSettingsLabel', 'Save deployment settings to workspace "{0}"', relativeSettingsFilePath);

export class DeployWorkspaceProjectSaveSettingsStep extends AzureWizardExecuteStep<DeployWorkspaceProjectInternalContext> {
    public priority: number = 1480;

    public async execute(context: DeployWorkspaceProjectInternalContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        this.options.continueOnFail = true;
        progress.report({ message: localize('saving', 'Saving configuration...') });

        const rootFolder: WorkspaceFolder = nonNullProp(context, 'rootFolder');
        const deploymentConfigurations: DeploymentConfigurationSettings[] = await dwpSettingUtilsV2.getWorkspaceDeploymentConfigurations(rootFolder) ?? [];

        const configurationLabel: string | undefined = context.configurationIdx !== undefined ? deploymentConfigurations?.[context.configurationIdx].label : undefined;
        const deploymentConfiguration: DeploymentConfigurationSettings = {
            label: configurationLabel || nonNullValueAndProp(context.containerApp, 'name'),
            type: 'AcrDockerBuildRequest',
            dockerfilePath: path.relative(rootFolder.uri.fsPath, nonNullProp(context, 'dockerfilePath')),
            srcPath: path.relative(rootFolder.uri.fsPath, context.srcPath || rootFolder.uri.fsPath) || ".",
            envPath: this.getEnvPath(rootFolder, context.envPath),
            resourceGroup: context.resourceGroup?.name,
            containerApp: context.containerApp?.name,
            containerRegistry: context.registry?.name,
        };

        if (context.configurationIdx !== undefined) {
            deploymentConfigurations[context.configurationIdx] = deploymentConfiguration;
        } else {
            deploymentConfigurations.push(deploymentConfiguration);
        }

        await dwpSettingUtilsV2.setWorkspaceDeploymentConfigurations(rootFolder, deploymentConfigurations);
    }

    public shouldExecute(context: DeployWorkspaceProjectInternalContext): boolean {
        return !!context.shouldSaveDeploySettings;
    }

    private getEnvPath(rootFolder: WorkspaceFolder, envPath: string | undefined): string {
        if (envPath === undefined) {
            return '';
        } else if (envPath === '') {
            return useRemoteConfigurationKey;
        } else {
            return path.relative(rootFolder.uri.fsPath, envPath);
        }
    }

    public createSuccessOutput(context: DeployWorkspaceProjectInternalContext): ExecuteActivityOutput {
        context.telemetry.properties.didSaveSettings = 'true';

        return {
            item: new GenericTreeItem(undefined, {
                contextValue: createUniversallyUniqueContextValue(['dwpSaveSettingsStepSuccessItem', activitySuccessContext]),
                label: saveSettingsLabel,
                iconPath: activitySuccessIcon
            }),
            message: localize('savedSettingsSuccess', 'Saved deployment settings to workspace "{0}".', relativeSettingsFilePath)
        };
    }

    public createFailOutput(context: DeployWorkspaceProjectInternalContext): ExecuteActivityOutput {
        context.telemetry.properties.didSaveSettings = 'false';

        return {
            item: new GenericTreeItem(undefined, {
                contextValue: createUniversallyUniqueContextValue(['dwpSaveSettingsStepFailItem', activityFailContext]),
                label: saveSettingsLabel,
                iconPath: activityFailIcon
            }),
            message: localize('savedSettingsFail', 'Failed to save deployment settings to workspace "{0}".', relativeSettingsFilePath)
        };
    }
}
