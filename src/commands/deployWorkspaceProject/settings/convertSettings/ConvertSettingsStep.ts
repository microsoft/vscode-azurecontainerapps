/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureWizardExecuteStep, nonNullProp } from "@microsoft/vscode-azext-utils";
import { ext } from "../../../../extensionVariables";
import { localize } from "../../../../utils/localize";
import { dwpSettingUtilsV2 } from "../../settings/dwpSettingUtilsV2";
import { type DeployWorkspaceProjectSettingsV1 } from "../DeployWorkspaceProjectSettingsV1";
import { type DeploymentConfigurationSettings } from "../DeployWorkspaceProjectSettingsV2";
import { dwpSettingUtilsV1 } from "../dwpSettingUtilsV1";
import { type ConvertSettingsContext } from "./ConvertSettingsContext";

export class ConvertSettingsStep extends AzureWizardExecuteStep<ConvertSettingsContext> {
    public priority: number = 50;

    public async execute(context: ConvertSettingsContext): Promise<void> {
        const settingsContentsV1: DeployWorkspaceProjectSettingsV1 = await dwpSettingUtilsV1.getDeployWorkspaceProjectSettings(nonNullProp(context, 'rootFolder'));
        const settingsContentsV2: DeploymentConfigurationSettings[] | undefined = await dwpSettingUtilsV2.getWorkspaceDeploymentConfigurations(nonNullProp(context, 'rootFolder'));

        if (settingsContentsV2?.length || (!settingsContentsV1.containerAppResourceGroupName && !settingsContentsV1.containerAppName && !settingsContentsV1.containerRegistryName)) {
            return;
        }

        const settingsV2: DeploymentConfigurationSettings = {
            "label": '',
            "type": 'AcrDockerBuildRequest',
            "dockerfilePath": '',
            "srcPath": '',
            "envPath": '',
        };

        const settingsV1ToRemove: DeployWorkspaceProjectSettingsV1 = {
            "containerAppResourceGroupName": undefined,
            "containerAppName": undefined,
            "containerRegistryName": undefined
        };

        if (settingsContentsV1.containerAppResourceGroupName) {
            settingsV2.resourceGroup = settingsContentsV1.containerAppResourceGroupName;
        }

        if (settingsContentsV1.containerAppName) {
            settingsV2.containerApp = settingsContentsV1.containerAppName;
        }

        if (settingsContentsV1.containerRegistryName) {
            settingsV2.containerRegistry = settingsContentsV1.containerRegistryName;
        }

        await dwpSettingUtilsV2.setWorkspaceDeploymentConfigurations(nonNullProp(context, 'rootFolder'), [settingsV2]);
        await dwpSettingUtilsV1.setDeployWorkspaceProjectSettings(nonNullProp(context, 'rootFolder'), settingsV1ToRemove);

        ext.outputChannel.appendLog(localize('convertedSettings', 'Detected deprecated deployment settings. Automatically converting settings to the latest workspace deployment schema.'));
    }

    public shouldExecute(): boolean {
        return true;
    }
}
