/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, nonNullProp } from "@microsoft/vscode-azext-utils";
import * as path from "path";
import { type WorkspaceFolder } from "vscode";
import { localize } from "../../../utils/localize";
import { useRemoteConfigurationKey } from "../deploymentConfiguration/workspace/filePaths/EnvUseRemoteConfigurationPromptStep";
import { type DeploymentConfigurationSettings } from "../settings/DeployWorkspaceProjectSettingsV2";
import { dwpSettingUtilsV2 } from "../settings/dwpSettingUtilsV2";
import { type DeployWorkspaceProjectInternalContext } from "./DeployWorkspaceProjectInternalContext";

export class ShouldSaveDeploySettingsPromptStep extends AzureWizardPromptStep<DeployWorkspaceProjectInternalContext> {
    public async prompt(context: DeployWorkspaceProjectInternalContext): Promise<void> {
        if (context.configurationIdx !== undefined) {
            const rootFolder: WorkspaceFolder = nonNullProp(context, 'rootFolder');
            const rootPath: string = rootFolder.uri.fsPath;

            const settings: DeploymentConfigurationSettings[] | undefined = await dwpSettingUtilsV2.getWorkspaceDeploymentConfigurations(rootFolder);
            const setting: DeploymentConfigurationSettings | undefined = settings?.[context.configurationIdx];

            let hasNewEnvPath: boolean;
            if (context.envPath) {
                hasNewEnvPath = convertRelativeToAbsolutePath(rootPath, setting?.envPath) !== context.envPath;
            } else if (context.envPath === '') {
                hasNewEnvPath = setting?.envPath !== useRemoteConfigurationKey;
            } else {
                hasNewEnvPath = context.envPath !== setting?.envPath;
            }

            const hasNewResourceGroupSetting: boolean = (!!context.newResourceGroupName && setting?.resourceGroup !== context.newResourceGroupName) ||
                (!!context.resourceGroup && setting?.resourceGroup !== context.resourceGroup.name);
            const hasNewContainerAppSetting: boolean = (!!context.newContainerAppName && setting?.containerApp !== context.newContainerAppName) ||
                (!!context.containerApp && setting?.containerApp !== context.containerApp.name);
            const hasNewRegistrySetting: boolean = (!!context.newRegistryName && setting?.containerRegistry !== context.newRegistryName) ||
                (!!context.registry && setting?.containerRegistry !== context.registry.name);

            const hasNewSettings: boolean =
                !setting?.label ||
                setting?.type !== 'AcrDockerBuildRequest' ||
                (context.dockerfilePath && convertRelativeToAbsolutePath(rootPath, setting?.dockerfilePath) !== context.dockerfilePath) ||
                hasNewEnvPath ||
                (context.srcPath && convertRelativeToAbsolutePath(rootPath, setting?.srcPath) !== context.srcPath) ||
                hasNewResourceGroupSetting ||
                hasNewContainerAppSetting ||
                hasNewRegistrySetting;

            if (!hasNewSettings) {
                context.telemetry.properties.hasNewSettings = 'false';
                return;
            }
        }

        context.telemetry.properties.hasNewSettings = 'true';

        const saveOrOverwrite: string = context.configurationIdx ? localize('overwrite', 'overwrite') : localize('save', 'save');
        const saveItem = { title: localize('saveItem', 'Save') };
        const dontSaveItem = { title: localize('dontSaveItem', 'Don\'t Save') };

        const userResponse = await context.ui.showWarningMessage(
            localize('saveWorkspaceSettings', `Would you like to ${saveOrOverwrite} your deployment configuration in local project settings?`),
            { modal: true },
            saveItem,
            dontSaveItem
        );

        context.shouldSaveDeploySettings = userResponse === saveItem;
        context.telemetry.properties.shouldSaveDeploySettings = context.shouldSaveDeploySettings ? 'true' : 'false';
    }

    public shouldPrompt(context: DeployWorkspaceProjectInternalContext): boolean {
        return context.shouldSaveDeploySettings === undefined;
    }
}

function convertRelativeToAbsolutePath(rootPath: string, relativePath: string | undefined): string | undefined {
    if (!relativePath) {
        return undefined;
    }

    return path.join(rootPath, relativePath);
}
