/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzExtFsExtra, AzureWizardPromptStep, nonNullValueAndProp } from "@microsoft/vscode-azext-utils";
import * as path from "path";
import { containerAppSettingsFile, vscodeFolder } from "../../constants";
import { localize } from "../../utils/localize";
import { IDeployWorkspaceProjectContext } from "./IDeployWorkspaceProjectContext";
import { IDeployWorkspaceProjectSettings } from "./IDeployWorkspaceProjectSettings";

export class ShouldSaveSettingsPromptStep extends AzureWizardPromptStep<IDeployWorkspaceProjectContext> {
    public async prompt(context: IDeployWorkspaceProjectContext): Promise<void> {
        const rootPath: string = nonNullValueAndProp(context.rootFolder?.uri, 'path');
        const settingsPath: string = path.join(rootPath, vscodeFolder, containerAppSettingsFile);

        const settings: IDeployWorkspaceProjectSettings | undefined = await AzExtFsExtra.pathExists(settingsPath) ? JSON.parse(await AzExtFsExtra.readFile(settingsPath)) as IDeployWorkspaceProjectSettings : undefined;

        if (context.registry && settings?.acrName === context.registry.name && context.containerApp && settings?.containerAppName === context.containerApp.name) {
            // No new changes to save
            return;
        }

        const saveItem = { title: localize('save', 'Save...') };

        const userResponse = await context.ui.showWarningMessage(
            localize('saveWorkspaceSettings', 'New deployment settings detected. \nWould you like to save or overwrite your local project settings on successful deployment?'),
            { modal: true },
            saveItem,
        );

        context.shouldSaveWorkspaceSettings = userResponse === saveItem;
    }

    public shouldPrompt(context: IDeployWorkspaceProjectContext): boolean {
        return context.shouldSaveWorkspaceSettings === undefined;
    }
}
