/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzExtFsExtra, AzureWizardExecuteStep, GenericTreeItem, nonNullValueAndProp } from "@microsoft/vscode-azext-utils";
import * as path from "path";
import { type Progress } from "vscode";
import { activityFailContext, activityFailIcon, activitySuccessContext, activitySuccessIcon, containerAppSettingsFile, vscodeFolder } from "../../constants";
import { ExecuteActivityOutput, createActivityChildContext, tryCatchActivityWrapper } from "../../utils/activityUtils";
import { localize } from "../../utils/localize";
import { IDeployWorkspaceProjectContext } from "./IDeployWorkspaceProjectContext";
import { IDeployWorkspaceProjectSettings } from "./IDeployWorkspaceProjectSettings";

const relativeSettingsFilePath: string = `${vscodeFolder}/${containerAppSettingsFile}`;
const saveSettingsLabel: string = localize('saveSettingsLabel', 'Save deployment settings to workspace: "{0}"', relativeSettingsFilePath);

export class DeployWorkspaceProjectSaveSettingsStep extends AzureWizardExecuteStep<IDeployWorkspaceProjectContext> {
    public priority: number = 1480;
    private success: ExecuteActivityOutput = {};
    private fail: ExecuteActivityOutput = {};

    public async execute(context: IDeployWorkspaceProjectContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        this.initSuccessOutput();
        this.initFailOutput();

        await tryCatchActivityWrapper(
            async () => {
                progress.report({ message: localize('saving', 'Saving configuration...') });

                const rootPath: string = nonNullValueAndProp(context.rootFolder?.uri, 'path');
                const settingsPath: string = path.join(rootPath, vscodeFolder, containerAppSettingsFile);

                const settings: IDeployWorkspaceProjectSettings = {
                    containerAppResourceGroupName: nonNullValueAndProp(context.resourceGroup, 'name'),
                    containerAppName: nonNullValueAndProp(context.containerApp, 'name'),
                    acrName: nonNullValueAndProp(context.registry, 'name')
                }

                await AzExtFsExtra.writeFile(settingsPath, JSON.stringify(settings, undefined, 4));
            },
            context, this.success, this.fail, { shouldSwallowError: true /** Not worth failing the entire command over this */ }
        )
    }

    public shouldExecute(context: IDeployWorkspaceProjectContext): boolean {
        return !!context.shouldSaveWorkspaceSettings;
    }

    private initSuccessOutput(): void {
        this.success.item = new GenericTreeItem(undefined, {
            contextValue: createActivityChildContext(['deployWorkspaceProjectSaveSettingsStep', activitySuccessContext]),
            label: saveSettingsLabel,
            iconPath: activitySuccessIcon
        });
        this.success.output = localize('savedSettingsSuccess', 'Saved deployment settings to workspace: "{0}"', relativeSettingsFilePath);
    }

    private initFailOutput(): void {
        this.fail.item = new GenericTreeItem(undefined, {
            contextValue: createActivityChildContext(['deployWorkspaceProjectSaveSettingsStep', activityFailContext]),
            label: saveSettingsLabel,
            iconPath: activityFailIcon
        });
        this.fail.output = localize('savedSettingsFail', 'Failed to save deployment settings to workspace: "{0}"', relativeSettingsFilePath);
    }
}
