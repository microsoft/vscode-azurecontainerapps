/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, nonNullProp } from "@microsoft/vscode-azext-utils";
import { localize } from "../../../utils/localize";
import { type DeploymentConfigurationSettings } from "../settings/DeployWorkspaceProjectSettingsV2";
import { dwpSettingUtilsV2 } from "../settings/dwpSettingUtilsV2";
import { type DeployWorkspaceProjectInternalContext } from "./DeployWorkspaceProjectInternalContext";

export class ShouldSaveDeploySettingsPromptStep extends AzureWizardPromptStep<DeployWorkspaceProjectInternalContext> {
    public async prompt(context: DeployWorkspaceProjectInternalContext): Promise<void> {
        if (context.configurationIdx !== undefined) {
            const settings: DeploymentConfigurationSettings[] | undefined = await dwpSettingUtilsV2.getWorkspaceDeploymentConfigurations(nonNullProp(context, 'rootFolder'));
            const setting: DeploymentConfigurationSettings | undefined = settings?.[context.configurationIdx];

            const hasNewSettings: boolean =
                setting?.type !== 'AcrDockerBuildRequest' ||
                (context.dockerfilePath && setting?.dockerfilePath !== context.dockerfilePath) ||
                (context.envPath && setting?.envPath !== context.envPath) ||
                (context.srcPath && setting?.srcPath !== context.srcPath) ||
                (!!context.resourceGroup && setting?.resourceGroup !== context.resourceGroup.name) ||
                (!!context.containerApp && setting?.containerApp !== context.containerApp.name) ||
                (!!context.registry && setting?.containerRegistry !== context.registry.name);

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
