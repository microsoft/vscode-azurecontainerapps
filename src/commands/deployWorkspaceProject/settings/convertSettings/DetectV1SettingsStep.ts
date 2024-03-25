/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzExtFsExtra, AzureWizardPromptStep, DialogResponses, nonNullProp } from "@microsoft/vscode-azext-utils";
import type * as vscode from 'vscode';
import { localize } from "../../../../utils/localize";
import { settingUtils } from "../../../../utils/settingUtils";
import { type DeployWorkspaceProjectContext } from "../../DeployWorkspaceProjectContext";

export class DetectV1SettingsStep extends AzureWizardPromptStep<DeployWorkspaceProjectContext> {
    public async prompt(context: DeployWorkspaceProjectContext): Promise<void> {
        const settingsPath: string = settingUtils.getDefaultRootWorkspaceSettingsPath(nonNullProp(context, 'rootFolder'));
        const settingsContents: string = await AzExtFsExtra.readFile(settingsPath);

        if (settingsContents.includes('containerAppResourceGroupName') ||
            settingsContents.includes('containerAppName') ||
            settingsContents.includes('containerRegistryName')) {
            const placeHolder: string = localize('oldSchema', 'Your settings.json file is using the old schema. Would you like to convert it to the new schema?');
            const result: vscode.MessageItem = await context.ui.showWarningMessage(placeHolder, { modal: true }, DialogResponses.yes, DialogResponses.no);
            if (result === DialogResponses.yes) {
                context.shouldConvertSettings = true;
            } else {
                context.shouldConvertSettings = false;
            }
        }
    }

    public shouldPrompt(): boolean {
        return true;
    }
}
