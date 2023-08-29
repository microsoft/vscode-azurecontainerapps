/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardExecuteStep, GenericTreeItem, nonNullProp, nonNullValueAndProp } from "@microsoft/vscode-azext-utils";
import { type Progress } from "vscode";
import { activityFailContext, activityFailIcon, activitySuccessContext, activitySuccessIcon, relativeSettingsFilePath } from "../../constants";
import { ExecuteActivityOutput, createActivityChildContext, tryCatchActivityWrapper } from "../../utils/activityUtils";
import { localize } from "../../utils/localize";
import { IDeployWorkspaceProjectContext } from "./IDeployWorkspaceProjectContext";
import { IDeployWorkspaceProjectSettings, setDeployWorkspaceProjectSettings } from "./deployWorkspaceProjectSettings";

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

                const settings: IDeployWorkspaceProjectSettings = {
                    containerAppResourceGroupName: nonNullValueAndProp(context.resourceGroup, 'name'),
                    containerAppName: nonNullValueAndProp(context.containerApp, 'name'),
                    containerRegistryName: nonNullValueAndProp(context.registry, 'name')
                }

                await setDeployWorkspaceProjectSettings(nonNullProp(context, 'rootFolder'), settings);
            },
            context, this.success, this.fail, { shouldSwallowError: true /** On fail, don't show a fail on the entire command */ }
        );
    }

    public shouldExecute(context: IDeployWorkspaceProjectContext): boolean {
        return !!context.shouldSaveDeploySettings;
    }

    private initSuccessOutput(): void {
        this.success.item = new GenericTreeItem(undefined, {
            contextValue: createActivityChildContext(['deployWorkspaceProjectSaveSettingsStep', activitySuccessContext]),
            label: saveSettingsLabel,
            iconPath: activitySuccessIcon
        });
        this.success.output = localize('savedSettingsSuccess', 'Saved deployment settings to workspace: "{0}".', relativeSettingsFilePath);
    }

    private initFailOutput(): void {
        this.fail.item = new GenericTreeItem(undefined, {
            contextValue: createActivityChildContext(['deployWorkspaceProjectSaveSettingsStep', activityFailContext]),
            label: saveSettingsLabel,
            iconPath: activityFailIcon
        });
        this.fail.output = localize('savedSettingsFail', 'Failed to save deployment settings to workspace: "{0}".', relativeSettingsFilePath);
    }
}
