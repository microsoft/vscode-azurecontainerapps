/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzExtFsExtra, GenericTreeItem, activityFailContext, activityFailIcon, activitySuccessContext, activitySuccessIcon, nonNullProp, nonNullValueAndProp } from "@microsoft/vscode-azext-utils";
import * as path from "path";
import { type Progress } from "vscode";
import { ExecuteActivityOutputStepBase, type ExecuteActivityOutput } from "../../../../utils/activity/ExecuteActivityOutputStepBase";
import { createActivityChildContext } from "../../../../utils/activity/activityUtils";
import { localize } from "../../../../utils/localize";
import { type DeploymentConfigurationSettings } from "../../settings/DeployWorkspaceProjectSettingsV2";
import { type DeploymentConfiguration } from "../DeploymentConfiguration";
import { type WorkspaceDeploymentConfigurationContext } from "./WorkspaceDeploymentConfigurationContext";

export abstract class FilePathsVerifyStep extends ExecuteActivityOutputStepBase<WorkspaceDeploymentConfigurationContext> {
    abstract deploymentSettingskey: keyof DeploymentConfigurationSettings;
    abstract contextKey: keyof DeploymentConfiguration;
    abstract fileType: string;

    private configPath: string | undefined;

    public constructor() {
        super();
    }

    protected async executeCore(context: WorkspaceDeploymentConfigurationContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        this.options.shouldSwallowError = true;
        progress.report({ message: localize('verifyingFilePaths', `Verifying file paths...`) });

        const rootPath: string = nonNullProp(context, 'rootFolder').uri.fsPath;

        this.configPath = nonNullValueAndProp(context.deploymentConfigurationSettings, this.deploymentSettingskey);

        if (!context[this.contextKey] && this.configPath) {
            const fullPath = path.join(rootPath, this.configPath);
            if (await this.verifyFilePath(fullPath) && typeof context[this.contextKey] === 'string') {
                context[this.contextKey] = fullPath;
            }
        }
    }

    public async verifyFilePath(path: string): Promise<boolean> {
        if (await AzExtFsExtra.pathExists(path)) {
            return true;
        } else {
            throw new Error(localize('fileNotFound', 'File not found: {0}', this.configPath));
        }
    }

    protected createSuccessOutput(_: WorkspaceDeploymentConfigurationContext): ExecuteActivityOutput {
        if (!this.configPath || this.configPath === '') {
            return {};
        }

        return {
            item: new GenericTreeItem(undefined, {
                contextValue: createActivityChildContext(['filePathVerifyStepSuccessItem', activitySuccessContext]),
                label: localize('verifyPath', 'Verify {0} path', this.fileType),
                iconPath: activitySuccessIcon
            }),
            message: localize('verifyPathSuccess', 'Verified {0} path.', this.fileType)
        };
    }

    protected createFailOutput(_: WorkspaceDeploymentConfigurationContext): ExecuteActivityOutput {
        return {
            item: new GenericTreeItem(undefined, {
                contextValue: createActivityChildContext(['filePathVerifyStepFailItem', activityFailContext]),
                label: localize('verifyPath', 'Verify {0} path', this.fileType),
                iconPath: activityFailIcon
            }),
            message: localize('verifyPathFail', 'Failed to verify {0} path.', this.fileType)
        };
    }
}
