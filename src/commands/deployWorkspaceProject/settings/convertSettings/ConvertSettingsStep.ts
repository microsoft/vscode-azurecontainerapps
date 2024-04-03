/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureWizardExecuteStep, nonNullProp } from "@microsoft/vscode-azext-utils";
import { ext } from "../../../../extensionVariables";
import { localize } from "../../../../utils/localize";
import { dwpSettingUtilsV2 } from "../../settings/dwpSettingUtilsV2";
import { type DeployWorkspaceProjectSettingsV1 } from "../DeployWorkspaceProjectSettingsV1";
import { type DeployWorkspaceProjectSettingsV2 } from "../DeployWorkspaceProjectSettingsV2";
import { dwpSettingUtilsV1 } from "../dwpSettingUtilsV1";
import { type ConvertSettingsContext } from "./ConvertSettingsContext";

export class ConvertSettingsStep extends AzureWizardExecuteStep<ConvertSettingsContext> {
    public priority: number = 50;

    public async execute(context: ConvertSettingsContext): Promise<void> {
        const settingsContentV1: DeployWorkspaceProjectSettingsV1 = await dwpSettingUtilsV1.getDeployWorkspaceProjectSettings(nonNullProp(context, 'rootFolder'));
        const settingsContentV2: DeployWorkspaceProjectSettingsV2 = await dwpSettingUtilsV2.getDeployWorkspaceProjectSettings(nonNullProp(context, 'rootFolder'));

        if (dwpSettingUtilsV1.hasNoDeployWorkspaceProjectSettings(settingsContentV1) || settingsContentV2.deploymentConfigurations?.length) {
            return;
        }

        const newSettingsV2: DeployWorkspaceProjectSettingsV2 = {
            sharedResourceGroup: settingsContentV1.containerAppResourceGroupName,
            sharedEnvironment: '',
            sharedRegistry: settingsContentV1.containerRegistryName,
            deploymentConfigurations: [
                {
                    label: '',
                    type: 'AcrDockerBuildRequest',
                    dockerfilePath: '',
                    srcPath: '',
                    envPath: '',
                    containerApp: settingsContentV1.containerAppName
                }
            ]
        }

        await dwpSettingUtilsV2.setDeployWorkspaceProjectSettings(nonNullProp(context, 'rootFolder'), newSettingsV2);

        const removeSettingsV1: DeployWorkspaceProjectSettingsV1 = {
            "containerAppResourceGroupName": undefined,
            "containerAppName": undefined,
            "containerRegistryName": undefined
        };
        await dwpSettingUtilsV1.setDeployWorkspaceProjectSettings(nonNullProp(context, 'rootFolder'), removeSettingsV1);

        ext.outputChannel.appendLog(localize('convertedSettings', 'Detected deprecated deployment settings. Automatically converting settings to the latest workspace deployment schema.'));
    }

    public shouldExecute(): boolean {
        return true;
    }
}
