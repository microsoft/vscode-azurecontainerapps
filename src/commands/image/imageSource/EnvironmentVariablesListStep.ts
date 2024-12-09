/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type EnvironmentVar } from "@azure/arm-appcontainers";
import { AzExtFsExtra, AzureWizardPromptStep, GenericTreeItem, activitySuccessContext, activitySuccessIcon, createUniversallyUniqueContextValue } from "@microsoft/vscode-azext-utils";
import { parse, type DotenvParseOutput } from "dotenv";
import { RelativePattern, workspace, type Uri, type WorkspaceFolder } from "vscode";
import { ImageSource, envFileGlobPattern } from "../../../constants";
import { ext } from "../../../extensionVariables";
import { type EnvironmentVariableTelemetryProps as TelemetryProps } from "../../../telemetry/ImageSourceTelemetryProps";
import { type SetTelemetryProps } from "../../../telemetry/SetTelemetryProps";
import { localize } from "../../../utils/localize";
import { selectWorkspaceFile } from "../../../utils/workspaceUtils";
import { type ImageSourceBaseContext } from "./ImageSourceContext";

export enum SetEnvironmentVariableOption {
    NoDotEnv = 'noDotEnv',
    SkipForNow = 'skipForNow',
    ProvideFile = 'provideFile',
    UseExisting = 'useExisting'
}

type EnvironmentVariablesContext = ImageSourceBaseContext & SetTelemetryProps<TelemetryProps>;

const allEnvFilesGlobPattern: string = `**/${envFileGlobPattern}`;

export class EnvironmentVariablesListStep extends AzureWizardPromptStep<EnvironmentVariablesContext> {
    private _setEnvironmentVariableOption?: SetEnvironmentVariableOption;

    public async prompt(context: EnvironmentVariablesContext): Promise<void> {
        // since we only allow one container, we can assume that we want the first container's env settings
        const existingData = context.containerApp?.template?.containers?.[0].env;
        context.envPath ??= await this.promptForEnvPath(context, !!existingData /** showHasExistingData */);

        if (!context.envPath && existingData) {
            context.environmentVariables = existingData;
            this._setEnvironmentVariableOption = SetEnvironmentVariableOption.UseExisting;
        } else {
            context.environmentVariables = await this.parseEnvironmentVariablesFromEnvPath(context.envPath);
        }

        if (this._setEnvironmentVariableOption) {
            this.outputLogs(context, this._setEnvironmentVariableOption);
        }
    }

    public async configureBeforePrompt(context: EnvironmentVariablesContext): Promise<void> {
        if (context.environmentVariables?.length === 0) {
            context.telemetry.properties.environmentVariableFileCount = '0';
            this._setEnvironmentVariableOption = SetEnvironmentVariableOption.NoDotEnv;
        }

        if (this._setEnvironmentVariableOption) {
            this.outputLogs(context, this._setEnvironmentVariableOption);
        }
    }

    public shouldPrompt(context: EnvironmentVariablesContext): boolean {
        return context.imageSource !== ImageSource.QuickstartImage && context.environmentVariables === undefined;
    }

    private async promptForEnvPath(context: EnvironmentVariablesContext, showHasExistingData?: boolean): Promise<string | undefined> {
        const placeHolder: string = localize('setEnvVar', 'Select a {0} file to set the environment variables for the container instance', '.env');
        const skipLabel: string | undefined = showHasExistingData ? localize('useExisting', 'Use existing configuration') : undefined;

        return await selectWorkspaceFile(context, placeHolder,
            { filters: { 'env file': ['env', 'env.*'] }, allowSkip: true, skipLabel }, allEnvFilesGlobPattern);
    }

    private async parseEnvironmentVariablesFromEnvPath(envPath: string | undefined): Promise<EnvironmentVar[]> {
        if (!envPath || !await AzExtFsExtra.pathExists(envPath)) {
            this._setEnvironmentVariableOption = SetEnvironmentVariableOption.SkipForNow;
            return [];
        }

        this._setEnvironmentVariableOption = SetEnvironmentVariableOption.ProvideFile;

        const data: string = await AzExtFsExtra.readFile(envPath);
        const envData: DotenvParseOutput = parse(data);

        return Object.keys(envData).map(name => { return { name, value: envData[name] } });
    }

    public static async workspaceHasEnvFile(rootFolder?: WorkspaceFolder): Promise<boolean> {
        let envFileUris: Uri[];
        if (rootFolder) {
            const relativePattern: RelativePattern = new RelativePattern(rootFolder, allEnvFilesGlobPattern);
            envFileUris = await workspace.findFiles(relativePattern);
        } else {
            envFileUris = await workspace.findFiles(allEnvFilesGlobPattern);
        }
        return !!envFileUris.length;
    }

    // Todo: It might be nice to add a direct command to update just the environment variables rather than having to suggest to re-run the entire command again
    private outputLogs(context: EnvironmentVariablesContext, setEnvironmentVariableOption: SetEnvironmentVariableOption): void {
        context.telemetry.properties.setEnvironmentVariableOption = setEnvironmentVariableOption;

        if (
            setEnvironmentVariableOption === SetEnvironmentVariableOption.NoDotEnv ||
            setEnvironmentVariableOption === SetEnvironmentVariableOption.SkipForNow
        ) {
            context.activityChildren?.push(
                new GenericTreeItem(undefined, {
                    contextValue: createUniversallyUniqueContextValue(['environmentVariablesListStepSuccessItem', setEnvironmentVariableOption, activitySuccessContext]),
                    label: localize('skipEnvVarsLabel',
                        'Skip environment variable configuration' +
                        (setEnvironmentVariableOption === SetEnvironmentVariableOption.NoDotEnv ? ' (no .env files found)' : '')
                    ),
                    iconPath: activitySuccessIcon
                })
            );

            const logMessage: string = localize('skippedEnvVarsMessage',
                'Skipped environment variable configuration for the container app' +
                (setEnvironmentVariableOption === SetEnvironmentVariableOption.NoDotEnv ? ' because no .env files were detected. ' : '. ') +
                'If you would like to update your environment variables later, try re-running the container app update or deploy command.'
            );
            ext.outputChannel.appendLog(logMessage);
        } else if (setEnvironmentVariableOption === SetEnvironmentVariableOption.ProvideFile) {
            context.activityChildren?.push(
                new GenericTreeItem(undefined, {
                    contextValue: createUniversallyUniqueContextValue(['environmentVariablesListStepSuccessItem', activitySuccessContext]),
                    label: localize('saveEnvVarsFileLabel', 'Save environment variables using provided .env file'),
                    iconPath: activitySuccessIcon
                })
            );
            ext.outputChannel.appendLog(localize('savedEnvVarsFileMessage', 'Saved environment variables using provided .env file "{0}".', context.envPath));
        } else if (setEnvironmentVariableOption === SetEnvironmentVariableOption.UseExisting) {
            context.activityChildren?.push(
                new GenericTreeItem(undefined, {
                    contextValue: createUniversallyUniqueContextValue(['environmentVariablesListStepSuccessItem', activitySuccessContext]),
                    label: localize('useExistingEnvVarsLabel', 'Use existing environment variables'),
                    iconPath: activitySuccessIcon
                })
            );
            ext.outputChannel.appendLog(localize('useExistingEnvVarsMessage', 'Used existing environment variables.'));
        }
    }
}
