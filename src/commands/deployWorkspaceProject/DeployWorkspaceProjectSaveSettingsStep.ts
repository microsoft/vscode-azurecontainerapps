/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { GenericTreeItem, activityFailContext, activityFailIcon, activitySuccessContext, activitySuccessIcon, nonNullProp, nonNullValueAndProp } from "@microsoft/vscode-azext-utils";
import { type Progress } from "vscode";
import { relativeSettingsFilePath } from "../../constants";
import { ExecuteActivityOutputStepBase, type ExecuteActivityOutput } from "../../utils/activity/ExecuteActivityOutputStepBase";
import { createActivityChildContext } from "../../utils/activity/activityUtils";
import { localize } from "../../utils/localize";
import { type DeployWorkspaceProjectContext } from "./DeployWorkspaceProjectContext";
import { setDeployWorkspaceProjectSettings, type DeployWorkspaceProjectSettings } from "./deployWorkspaceProjectSettings";

const saveSettingsLabel: string = localize('saveSettingsLabel', 'Save deployment settings to workspace "{0}"', relativeSettingsFilePath);

export class DeployWorkspaceProjectSaveSettingsStep extends ExecuteActivityOutputStepBase<DeployWorkspaceProjectContext> {
    public priority: number = 1480;

    protected async executeCore(context: DeployWorkspaceProjectContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        // Even if this step fails, there's no need to show the whole activity as failed.
        // Swallow the error and just show the activity failed item and output log message instead.
        this.options.shouldSwallowError = true;

        progress.report({ message: localize('saving', 'Saving configuration...') });

        const settings: DeployWorkspaceProjectSettings = {
            containerAppResourceGroupName: nonNullValueAndProp(context.resourceGroup, 'name'),
            containerAppName: nonNullValueAndProp(context.containerApp, 'name'),
            containerRegistryName: nonNullValueAndProp(context.registry, 'name')
        };

        await setDeployWorkspaceProjectSettings(nonNullProp(context, 'rootFolder'), settings);
    }

    public shouldExecute(context: DeployWorkspaceProjectContext): boolean {
        return !!context.shouldSaveDeploySettings;
    }

    protected createSuccessOutput(context: DeployWorkspaceProjectContext): ExecuteActivityOutput {
        context.telemetry.properties.didSaveSettings = 'true';

        return {
            item: new GenericTreeItem(undefined, {
                contextValue: createActivityChildContext(['deployWorkspaceProjectSaveSettingsStep', activitySuccessContext]),
                label: saveSettingsLabel,
                iconPath: activitySuccessIcon
            }),
            message: localize('savedSettingsSuccess', 'Saved deployment settings to workspace "{0}".', relativeSettingsFilePath)
        };
    }

    protected createFailOutput(context: DeployWorkspaceProjectContext): ExecuteActivityOutput {
        context.telemetry.properties.didSaveSettings = 'false';

        return {
            item: new GenericTreeItem(undefined, {
                contextValue: createActivityChildContext(['deployWorkspaceProjectSaveSettingsStep', activityFailContext]),
                label: saveSettingsLabel,
                iconPath: activityFailIcon
            }),
            message: localize('savedSettingsFail', 'Failed to save deployment settings to workspace "{0}".', relativeSettingsFilePath)
        };
    }
}
