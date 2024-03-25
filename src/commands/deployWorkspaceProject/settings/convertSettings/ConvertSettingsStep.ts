/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzExtFsExtra, AzureWizardExecuteStep, nonNullProp, type IActionContext } from "@microsoft/vscode-azext-utils";
import { settingUtils } from "../../../../utils/settingUtils";
import { type DeployWorkspaceProjectContext } from "../../DeployWorkspaceProjectContext";
import { dwpSettingUtilsV2 } from "../../settings/dwpSettingUtilsV2";
import { type DeploymentConfigurationSettings } from "../DeployWorkspaceProjectSettingsV2";

export class ConvertSettingsStep extends AzureWizardExecuteStep<IActionContext> {
    public priority: number = 50;

    public async execute(context: DeployWorkspaceProjectContext): Promise<void> {
        const settingsPathV1: string = settingUtils.getDefaultRootWorkspaceSettingsPath(nonNullProp(context, 'rootFolder'));
        const settingsContentsV2: string = await AzExtFsExtra.readFile(settingsPathV1);
        const settingsV2: DeploymentConfigurationSettings = {};

        settingsV2.label = '';
        settingsV2.type = 'AcrDockerBuildRequest';
        settingsV2.dockerfilePath = '';
        settingsV2.srcPath = '';
        settingsV2.envPath = '';
        if (settingsContentsV2.includes('containerAppResourceGroupName')) {
            settingsV2.resourceGroup = settingsContentsV2.split('containerAppResourceGroupName": ')[1].split(/,|}/)[0].replace(/"|\r\n|\r|\n/g, '')
            await dwpSettingUtilsV2.setDeployWorkspaceProjectSettingsV2('deployWorkspaceProject.containerAppResourceGroupName', nonNullProp(context, 'rootFolder'), undefined);
        }

        if (settingsContentsV2.includes('containerAppName')) {
            settingsV2.containerApp = settingsContentsV2.split('containerAppName": ')[1].split(/,|}/)[0].replace(/"|\r\n|\r|\n/g, '')
            await dwpSettingUtilsV2.setDeployWorkspaceProjectSettingsV2('deployWorkspaceProject.containerAppName', nonNullProp(context, 'rootFolder'), undefined);
        }

        if (settingsContentsV2.includes('containerRegistryName')) {
            settingsV2.containerRegistry = settingsContentsV2.split('containerRegistryName": ')[1].split(/,|}/)[0].replace(/"|\r\n|\r|\n/g, '')
            await dwpSettingUtilsV2.setDeployWorkspaceProjectSettingsV2('deployWorkspaceProject.containerRegistryName', nonNullProp(context, 'rootFolder'), undefined);
        }

        await dwpSettingUtilsV2.setDeployWorkspaceProjectSettingsV2('deploymentConfigurations', nonNullProp(context, 'rootFolder'), [settingsV2]);
    }

    public shouldExecute(context: DeployWorkspaceProjectContext): boolean {
        return !!context.shouldConvertSettings;
    }
}

