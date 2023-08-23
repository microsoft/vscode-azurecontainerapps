/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzExtFsExtra, AzureWizardExecuteStep, GenericTreeItem, nonNullValueAndProp } from "@microsoft/vscode-azext-utils";
import * as path from "path";
import { ThemeColor, ThemeIcon, type Progress } from "vscode";
import { activityFailContext, activitySuccessContext, containerAppSettingsFile, vscodeFolder } from "../../constants";
import { ext } from "../../extensionVariables";
import { createActivityChildContext } from "../../utils/createActivityChildContext";
import { localize } from "../../utils/localize";
import { IDeployWorkspaceProjectContext } from "./IDeployWorkspaceProjectContext";
import { IDeployWorkspaceProjectSettings } from "./IDeployWorkspaceProjectSettings";

export class DeployWorkspaceProjectSaveSettingsStep extends AzureWizardExecuteStep<IDeployWorkspaceProjectContext> {
    public priority: number = 1480;

    public async execute(context: IDeployWorkspaceProjectContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        progress.report({ message: localize('saving', 'Saving configuration...') });

        const saveSettingsLabel: string = localize('saveSettingsLabel', 'Save deployment settings to workspace: "{0}"', `${vscodeFolder}/${containerAppSettingsFile}`);
        try {
            const rootPath: string = nonNullValueAndProp(context.rootFolder?.uri, 'path');
            const settingsPath: string = path.join(rootPath, vscodeFolder, containerAppSettingsFile);

            const settings: IDeployWorkspaceProjectSettings = {
                containerAppResourceGroupName: nonNullValueAndProp(context.resourceGroup, 'name'),
                containerAppName: nonNullValueAndProp(context.containerApp, 'name'),
                acrName: nonNullValueAndProp(context.registry, 'name')
            }

            await AzExtFsExtra.writeFile(settingsPath, JSON.stringify(settings, undefined, 4));

            context.activityChildren?.push(
                new GenericTreeItem(undefined, {
                    contextValue: createActivityChildContext(context.activityChildren.length, ['deployWorkspaceProjectSaveSettingsStep', activitySuccessContext]),
                    label: saveSettingsLabel,
                    iconPath: new ThemeIcon('pass', new ThemeColor('testing.iconPassed'))
                })
            );

            ext.outputChannel.appendLog(localize('savedSettingsSuccess', 'Saved deployment settings to workspace: "{0}"', `${vscodeFolder}/${containerAppSettingsFile}`));
        } catch (_e) {
            context.activityChildren?.push(
                new GenericTreeItem(undefined, {
                    contextValue: createActivityChildContext(context.activityChildren.length, ['deployWorkspaceProjectSaveSettingsStep', activityFailContext]),
                    label: saveSettingsLabel,
                    iconPath: new ThemeIcon('error', new ThemeColor('testing.iconFailed'))
                })
            );

            ext.outputChannel.appendLog(localize('savedSettingsFail', 'Failed to save deployment settings to workspace: "{0}"', `${vscodeFolder}/${containerAppSettingsFile}`));
        }
    }

    public shouldExecute(context: IDeployWorkspaceProjectContext): boolean {
        return !!context.shouldSaveWorkspaceSettings;
    }
}
