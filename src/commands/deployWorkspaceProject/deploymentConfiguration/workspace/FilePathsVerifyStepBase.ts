/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzExtFsExtra, GenericParentTreeItem, GenericTreeItem, activityFailContext, activityFailIcon, activitySuccessContext, activitySuccessIcon, nonNullProp } from "@microsoft/vscode-azext-utils";
import * as path from "path";
import { type Progress } from "vscode";
import { ExecuteActivityOutputStepBase, type ExecuteActivityOutput } from "../../../../utils/activity/ExecuteActivityOutputStepBase";
import { createActivityChildContext } from "../../../../utils/activity/activityUtils";
import { localize } from "../../../../utils/localize";
import { type WorkspaceDeploymentConfigurationContext } from "./WorkspaceDeploymentConfigurationContext";

export abstract class FilePathsVerifyBaseStep extends ExecuteActivityOutputStepBase<WorkspaceDeploymentConfigurationContext> {
    private contextPath: string | undefined;
    private configPath: string | undefined;
    private fileType: string | undefined;

    public constructor(contextPath?: string, configPath?: string, fileType?: string) {
        super();
        this.contextPath = contextPath;
        this.configPath = configPath;
        this.fileType = fileType;
    }

    protected async executeCore(context: WorkspaceDeploymentConfigurationContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        this.options.shouldSwallowError = true;
        progress.report({ message: localize('verifyingFilePaths', `Verifying file paths...`) });

        const rootPath: string = nonNullProp(context, 'rootFolder').uri.fsPath;

        if (!this.contextPath && this.configPath) {
            const fullPath = path.join(rootPath, this.configPath);
            if (await this.verifyFilePath(fullPath)) {
                this.contextPath = fullPath;
            }
        }
    }

    public shouldExecute(context: WorkspaceDeploymentConfigurationContext): boolean {
        return !!context.deploymentConfigurationSettings;
    }

    public async verifyFilePath(path: string): Promise<boolean> {
        if (await AzExtFsExtra.pathExists(path)) {
            return true;
        } else {
            return false;
        }
    }

    protected createSuccessOutput(_: WorkspaceDeploymentConfigurationContext): ExecuteActivityOutput {
        return {
            item: new GenericTreeItem(undefined, {
                contextValue: createActivityChildContext(['filePathVerifyStepSuccessItem', activitySuccessContext]),
                label: localize('verifyPath', 'Verify "{0}" path', this.fileType),
                iconPath: activitySuccessIcon
            }),
            message: localize('verifyPathSuccess', 'Verified "{0}" path.', this.fileType)
        };
    }

    protected createFailOutput(_: WorkspaceDeploymentConfigurationContext): ExecuteActivityOutput {
        return {
            item: new GenericParentTreeItem(undefined, {
                contextValue: createActivityChildContext(['filePathVerifyStepFailItem', activityFailContext]),
                label: localize('verifyPath', 'Verify "{0}" path', this.fileType),
                iconPath: activityFailIcon
            }),
            message: localize('verifyPathFail', 'Failed to verify "{0}" path.', this.fileType)
        };
    }
}
