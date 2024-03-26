/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, nonNullProp } from "@microsoft/vscode-azext-utils";
import { localize } from "../../../utils/localize";
import { type DeployWorkspaceProjectSettingsV1 } from "../settings/DeployWorkspaceProjectSettingsV1";
import { dwpSettingUtilsV1 } from "../settings/dwpSettingUtilsV1";
import { type DeployWorkspaceProjectInternalContext } from "./DeployWorkspaceProjectInternalContext";

export class ShouldSaveDeploySettingsPromptStep extends AzureWizardPromptStep<DeployWorkspaceProjectInternalContext> {
    public async prompt(context: DeployWorkspaceProjectInternalContext): Promise<void> {
        const settings: DeployWorkspaceProjectSettingsV1 = await dwpSettingUtilsV1.getDeployWorkspaceProjectSettings(nonNullProp(context, 'rootFolder'));

        if (
            context.registry && settings?.containerRegistryName === context.registry.name &&
            context.containerApp && settings?.containerAppName === context.containerApp.name
        ) {
            context.telemetry.properties.noNewSettings = 'true';
            return;
        }

        context.telemetry.properties.noNewSettings = 'false';

        const saveOrOverwrite: string = dwpSettingUtilsV1.hasNoDeployWorkspaceProjectSettings(settings) ? localize('save', 'save') : localize('overwrite', 'overwrite');
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
