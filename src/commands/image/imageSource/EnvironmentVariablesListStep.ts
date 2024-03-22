/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type EnvironmentVar } from "@azure/arm-appcontainers";
import { AzExtFsExtra, AzureWizardPromptStep, GenericTreeItem, activitySuccessContext, activitySuccessIcon } from "@microsoft/vscode-azext-utils";
import { parse, type DotenvParseOutput } from "dotenv";
import { workspace, type Uri } from "vscode";
import { ImageSource, envFileGlobPattern } from "../../../constants";
import { ext } from "../../../extensionVariables";
import { type EnvironmentVariableTelemetryProps as TelemetryProps } from "../../../telemetry/ImageSourceTelemetryProps";
import { type SetTelemetryProps } from "../../../telemetry/SetTelemetryProps";
import { createActivityChildContext } from "../../../utils/activity/activityUtils";
import { localize } from "../../../utils/localize";
import { selectWorkspaceFile } from "../../../utils/workspaceUtils";
import { type ImageSourceBaseContext } from "./ImageSourceContext";

export enum SetEnvironmentVariableOption {
    NoDotEnv = 'noDotEnv',
    SkipForNow = 'skipForNow',
    ProvideFile = 'provideFile',
    EnvPath = 'envPath',
    UseExisting = 'useExisting'
}

type EnvironmentVariablesContext = ImageSourceBaseContext & SetTelemetryProps<TelemetryProps>;

const allEnvFilesGlobPattern: string = `**/${envFileGlobPattern}`;

export class EnvironmentVariablesListStep extends AzureWizardPromptStep<EnvironmentVariablesContext> {
    private _setEnvironmentVariableOption?: SetEnvironmentVariableOption;

    public async prompt(context: EnvironmentVariablesContext): Promise<void> {
        const envData: DotenvParseOutput | undefined = await this.selectEnvironmentSettings(context);
        if (!envData) {
            context.environmentVariables = [];
        } else {
            context.environmentVariables = Object.keys(envData).map(name => { return { name, value: envData[name] } });
        }

        if (this._setEnvironmentVariableOption) {
            this.outputLogs(context, this._setEnvironmentVariableOption);
        }
    }

    public async configureBeforePrompt(context: EnvironmentVariablesContext): Promise<void> {
        if (context.environmentVariables?.length === 0) {
            context.telemetry.properties.environmentVariableFileCount = '0';
            this._setEnvironmentVariableOption = SetEnvironmentVariableOption.NoDotEnv
        }

        if (context.envPath) {
            context.telemetry.properties.environmentVariableFileCount = undefined;
            context.environmentVariables = await EnvironmentVariablesListStep.getEnvironmentVariablesFromEnvPath(context.envPath);
            this._setEnvironmentVariableOption = SetEnvironmentVariableOption.EnvPath;
        }

        if (this._setEnvironmentVariableOption) {
            this.outputLogs(context, this._setEnvironmentVariableOption);
        }
    }

    public static async getEnvironmentVariablesFromEnvPath(envPath: string): Promise<EnvironmentVar[]> {
        if (!await AzExtFsExtra.pathExists(envPath)) {
            return [];
        }

        const data: string = await AzExtFsExtra.readFile(envPath);
        const envData: DotenvParseOutput = parse(data);

        return Object.keys(envData).map(name => { return { name, value: envData[name] } });
    }

    public shouldPrompt(context: EnvironmentVariablesContext): boolean {
        return context.imageSource !== ImageSource.QuickstartImage && context.environmentVariables === undefined;
    }

    private async selectEnvironmentSettings(context: EnvironmentVariablesContext): Promise<DotenvParseOutput | undefined> {
        const placeHolder: string = localize('setEnvVar', 'Select a {0} file to set the environment variables for the container instance', '.env');
        // since we only allow one container, we can assume that we want the first container's env settings
        const existingData: DotenvParseOutput | undefined = context.containerApp?.template?.containers?.[0].env as DotenvParseOutput | undefined;
        const skipLabel: string | undefined = existingData ? localize('useExisting', 'Use existing configuration') : undefined;

        const envFileFsPath: string | undefined = await selectWorkspaceFile(context, placeHolder,
            { filters: { 'env file': ['env', 'env.*'] }, allowSkip: true, skipLabel }, allEnvFilesGlobPattern);

        if (!envFileFsPath) {
            this._setEnvironmentVariableOption = SetEnvironmentVariableOption.UseExisting;
            return existingData;
        }

        const data = await AzExtFsExtra.readFile(envFileFsPath);
        this._setEnvironmentVariableOption = data ? SetEnvironmentVariableOption.ProvideFile : SetEnvironmentVariableOption.SkipForNow;

        return parse(data);
    }

    public static async workspaceHasEnvFile(): Promise<boolean> {
        const envFileUris: Uri[] = await workspace.findFiles(allEnvFilesGlobPattern);
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
                    contextValue: createActivityChildContext(['environmentVariablesListStepSuccessItem', setEnvironmentVariableOption, activitySuccessContext]),
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
        } else {
            context.activityChildren?.push(
                new GenericTreeItem(undefined, {
                    contextValue: createActivityChildContext(['environmentVariablesListStepSuccessItem', setEnvironmentVariableOption, activitySuccessContext]),
                    label: localize('saveEnvVarsLabel', 'Save environment variable configuration'),
                    iconPath: activitySuccessIcon
                })
            );

            ext.outputChannel.appendLog(localize('savedEnvVarsMessage', 'Saved environment variable configuration.'));
        }
    }
}
