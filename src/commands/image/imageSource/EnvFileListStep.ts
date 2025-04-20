/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type EnvironmentVar } from "@azure/arm-appcontainers";
import { ActivityChildItem, ActivityChildType, AzExtFsExtra, AzureWizardPromptStep, activityInfoIcon, createContextValue } from "@microsoft/vscode-azext-utils";
import { parse, type DotenvParseOutput } from "dotenv";
import { RelativePattern, workspace, type Uri, type WorkspaceFolder } from "vscode";
import { ImageSource, activityInfoContext, envFileGlobPattern } from "../../../constants";
import { ext } from "../../../extensionVariables";
import { type EnvironmentVariableTelemetryProps as TelemetryProps } from "../../../telemetry/ImageSourceTelemetryProps";
import { type SetTelemetryProps } from "../../../telemetry/SetTelemetryProps";
import { localize } from "../../../utils/localize";
import { selectWorkspaceFile } from "../../../utils/workspaceUtils";
import { type EnvironmentVariablesContext } from "../../environmentVariables/EnvironmentVariablesContext";

export interface EnvFileListStepOptions {
    suppressSkipPick?: boolean;
}

export enum SetEnvironmentVariableOption {
    NoDotEnv = 'noDotEnv',
    SkipForNow = 'skipForNow',
    ProvideFile = 'provideFile',
    UseExisting = 'useExisting'
}

type EnvFileListContext = EnvironmentVariablesContext & SetTelemetryProps<TelemetryProps>;

const allEnvFilesGlobPattern: string = `**/${envFileGlobPattern}`;
const envFileListStepContext: string = 'envFileListStepItem';

export class EnvFileListStep<T extends EnvFileListContext> extends AzureWizardPromptStep<T> {
    private _setEnvironmentVariableOption?: SetEnvironmentVariableOption;
    private hasLogged: boolean = false;

    constructor(public readonly options?: EnvFileListStepOptions) {
        super();
    }

    public async configureBeforePrompt(context: T): Promise<void> {
        if (context.environmentVariables?.length === 0) {
            context.telemetry.properties.environmentVariableFileCount = '0';
            this._setEnvironmentVariableOption = SetEnvironmentVariableOption.NoDotEnv;
        }

        if (this._setEnvironmentVariableOption && !this.hasLogged) {
            this.outputLogs(context, this._setEnvironmentVariableOption);
        }
    }

    public async prompt(context: T): Promise<void> {
        const existingData = context.template?.containers?.[context.containersIdx ?? 0].env ?? context.containerApp?.template?.containers?.[context.containersIdx ?? 0].env;
        context.envPath ??= await this.promptForEnvPath(context, !!existingData /** showHasExistingData */);

        if (context.envPath) {
            context.environmentVariables = await this.parseEnvironmentVariablesFromEnvPath(context.envPath);
        } else if (existingData) {
            context.environmentVariables = existingData;
            this._setEnvironmentVariableOption = SetEnvironmentVariableOption.UseExisting;
        } else {
            this._setEnvironmentVariableOption = SetEnvironmentVariableOption.SkipForNow;
        }

        if (this._setEnvironmentVariableOption) {
            this.outputLogs(context, this._setEnvironmentVariableOption);
        }
    }

    public shouldPrompt(context: T): boolean {
        return context.imageSource !== ImageSource.QuickstartImage && context.environmentVariables === undefined;
    }

    private async promptForEnvPath(context: T, showHasExistingData?: boolean): Promise<string | undefined> {
        const placeHolder: string = localize('setEnvVar', 'Select a {0} file to set the environment variables for the container instance', '.env');
        const skipLabel: string | undefined = showHasExistingData ? localize('useExisting', 'Use existing configuration') : undefined;

        return await selectWorkspaceFile(context, placeHolder,
            { filters: { 'env file': ['env', 'env.*'] }, allowSkip: !this.options?.suppressSkipPick, skipLabel }, allEnvFilesGlobPattern);
    }

    private async parseEnvironmentVariablesFromEnvPath(envPath: string | undefined): Promise<EnvironmentVar[]> {
        if (!envPath || !await AzExtFsExtra.pathExists(envPath)) {
            this._setEnvironmentVariableOption = SetEnvironmentVariableOption.SkipForNow;
            return [];
        }

        this._setEnvironmentVariableOption = SetEnvironmentVariableOption.ProvideFile;
        return await EnvFileListStep.parseEnvironmentVariablesFromEnvPath(envPath);
    }

    public static async parseEnvironmentVariablesFromEnvPath(envPath: string | undefined): Promise<EnvironmentVar[]> {
        if (!envPath || !await AzExtFsExtra.pathExists(envPath)) {
            return [];
        }

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

    private outputLogs(context: T, setEnvironmentVariableOption: SetEnvironmentVariableOption): void {
        if (this.hasLogged) {
            // Todo: Handle this with the undo method (not currently exposed in utils type def file)
            // This path indicates user clicked the back button, so we need to undo the previous logs
            context.activityChildren?.pop();
            ext.outputChannel.appendLog(localize('resetEnv', 'User chose to go back a step - resetting environment variables.'));
        }

        context.telemetry.properties.setEnvironmentVariableOption = setEnvironmentVariableOption;

        if (
            setEnvironmentVariableOption === SetEnvironmentVariableOption.NoDotEnv ||
            setEnvironmentVariableOption === SetEnvironmentVariableOption.SkipForNow
        ) {
            context.activityChildren?.push(
                new ActivityChildItem({
                    label: localize('skipEnvVarsLabel',
                        'Skip environment variable configuration' +
                        (setEnvironmentVariableOption === SetEnvironmentVariableOption.NoDotEnv ? ' (no .env files found)' : '')
                    ),
                    contextValue: createContextValue([envFileListStepContext, setEnvironmentVariableOption, activityInfoContext]),
                    activityType: ActivityChildType.Info,
                    iconPath: activityInfoIcon,
                })
            );

            const logMessage: string = localize('skippedEnvVarsMessage',
                'Skipped environment variable configuration for the container app' +
                (setEnvironmentVariableOption === SetEnvironmentVariableOption.NoDotEnv ? ' because no .env files were detected.' : '.')
            );
            ext.outputChannel.appendLog(logMessage);
        } else if (setEnvironmentVariableOption === SetEnvironmentVariableOption.ProvideFile) {
            context.activityChildren?.push(
                new ActivityChildItem({
                    label: localize('saveEnvVarsFileLabel', 'Save environment variables using provided .env file'),
                    contextValue: createContextValue([envFileListStepContext, activityInfoContext]),
                    activityType: ActivityChildType.Info,
                    iconPath: activityInfoIcon,
                })
            );
            ext.outputChannel.appendLog(localize('savedEnvVarsFileMessage', 'Saved environment variables using provided .env file "{0}".', context.envPath));
        } else if (setEnvironmentVariableOption === SetEnvironmentVariableOption.UseExisting) {
            context.activityChildren?.push(
                new ActivityChildItem({
                    label: localize('useExistingEnvVarsLabel', 'Use existing environment variable configuration'),
                    contextValue: createContextValue([envFileListStepContext, activityInfoContext]),
                    activityType: ActivityChildType.Info,
                    iconPath: activityInfoIcon,
                })
            );
            ext.outputChannel.appendLog(localize('useExistingEnvVarsMessage', 'Used existing environment variable configuration.'));
        }

        this.hasLogged = true;
    }
}
