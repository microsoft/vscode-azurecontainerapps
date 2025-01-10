/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { activityFailContext, activityFailIcon, activitySuccessContext, activitySuccessIcon, AzExtFsExtra, AzureWizardExecuteStep, createUniversallyUniqueContextValue, GenericTreeItem, nonNullProp, nonNullValueAndProp, type ExecuteActivityOutput } from "@microsoft/vscode-azext-utils";
import * as path from "path";
import { type Progress } from "vscode";
import { localize } from "../../../../../utils/localize";
import { type WorkspaceDeploymentConfigurationContext } from "../WorkspaceDeploymentConfigurationContext";
import { useRemoteConfigurationKey, useRemoteConfigurationLabel, useRemoteConfigurationOutputMessage } from "./EnvUseRemoteConfigurationPromptStep";
import { verifyingFilePaths } from "./FilePathsVerifyStep";

export class EnvValidateStep<T extends WorkspaceDeploymentConfigurationContext> extends AzureWizardExecuteStep<T> {
    public priority: number = 120;
    private configEnvPath: string;

    public async execute(context: T, progress: Progress<{ message?: string; increment?: number; }>): Promise<void> {
        this.options.continueOnFail = true;
        progress.report({ message: verifyingFilePaths });

        this.configEnvPath = nonNullValueAndProp(context.deploymentConfigurationSettings, 'envPath');
        if (this.configEnvPath === useRemoteConfigurationKey) {
            context.envPath = '';
            return;
        }

        const rootPath: string = nonNullProp(context, 'rootFolder').uri.fsPath;
        if (!context.envPath && this.configEnvPath) {
            const fullPath: string = path.join(rootPath, this.configEnvPath);
            if (await this.verifyFilePath(fullPath)) {
                context.envPath = fullPath;
            }
        }
    }

    public shouldExecute(context: T): boolean {
        return context.envPath === undefined;
    }

    public async verifyFilePath(path: string): Promise<boolean> {
        if (await AzExtFsExtra.pathExists(path)) {
            return true;
        } else {
            throw new Error(localize('fileNotFound', 'File not found: {0}', path));
        }
    }

    public createSuccessOutput(context: T): ExecuteActivityOutput {
        if (context.envPath === undefined) {
            return {};
        }

        let label: string;
        let message: string;
        if (context.envPath === '') {
            label = useRemoteConfigurationLabel;
            message = useRemoteConfigurationOutputMessage;
        } else {
            label = localize('envPathLabel', 'Env path');
            message = localize('envPathSuccessMessage', 'Successfully verified {0} path "{1}".', '.env', context.envPath);
        }

        return {
            item: new GenericTreeItem(undefined, {
                contextValue: createUniversallyUniqueContextValue(['envValidateStepSuccessItem', activitySuccessContext]),
                label,
                iconPath: activitySuccessIcon
            }),
            message,
        };
    }

    public createFailOutput(): ExecuteActivityOutput {
        return {
            item: new GenericTreeItem(undefined, {
                contextValue: createUniversallyUniqueContextValue(['envValidateStepFailItem', activityFailContext]),
                label: localize('envPathLabel', 'Env path'),
                iconPath: activityFailIcon
            }),
            message: localize('envPathFailMessage', 'Failed to verify {0} path "{1}".', '.env', this.configEnvPath),
        };
    }
}
