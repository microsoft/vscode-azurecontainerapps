/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzExtFsExtra, AzureWizardPromptStep, GenericTreeItem, activitySuccessContext, activitySuccessIcon } from "@microsoft/vscode-azext-utils";
import { parse, type DotenvParseOutput } from "dotenv";
import { workspace, type Uri } from "vscode";
import { ImageSource, SetEnvironmentVariableOption, envFileGlobPattern } from "../../../constants";
import { ext } from "../../../extensionVariables";
import { type EnvironmentVariableTelemetryProps as TelemetryProps } from "../../../telemetry/ImageSourceTelemetryProps";
import { type SetTelemetryProps } from "../../../telemetry/SetTelemetryProps";
import { createActivityChildContext } from "../../../utils/activity/activityUtils";
import { localize } from "../../../utils/localize";
import { selectWorkspaceFile } from "../../../utils/workspaceUtils";
import { type ImageSourceBaseContext } from "./ImageSourceContext";

type EnvironmentVariablesContext = ImageSourceBaseContext & SetTelemetryProps<TelemetryProps>;

const allEnvFilesGlobPattern: string = `**/${envFileGlobPattern}`;

export class EnvironmentVariablesListStep extends AzureWizardPromptStep<EnvironmentVariablesContext> {
    public async prompt(context: EnvironmentVariablesContext): Promise<void> {
        const envData: DotenvParseOutput | undefined = await this.selectEnvironmentSettings(context);
        if (!envData) {
            context.environmentVariables = [];
            this.outputLogs(context, SetEnvironmentVariableOption.SkipForNow);
        } else {
            context.environmentVariables = Object.keys(envData).map(name => { return { name, value: envData[name] } });
            this.outputLogs(context, SetEnvironmentVariableOption.ProvideFile);
        }
    }

    public async configureBeforePrompt(context: EnvironmentVariablesContext): Promise<void> {
        if (context.environmentVariables?.length === 0) {
            context.telemetry.properties.environmentVariableFileCount = '0';
            this.outputLogs(context, SetEnvironmentVariableOption.NoDotEnv);
        }
    }

    public shouldPrompt(context: EnvironmentVariablesContext): boolean {
        return context.imageSource !== ImageSource.QuickStartImage && context.environmentVariables === undefined;
    }

    private async selectEnvironmentSettings(context: EnvironmentVariablesContext): Promise<DotenvParseOutput | undefined> {
        const placeHolder: string = localize('setEnvVar', 'Select a {0} file to set the environment variables for the container instance', '.env');
        const envFileFsPath: string | undefined = await selectWorkspaceFile(context, placeHolder,
            { filters: { 'env file': ['env', 'env.*'] }, allowSkip: true }, allEnvFilesGlobPattern);

        if (!envFileFsPath) {
            return undefined;
        }

        const data = await AzExtFsExtra.readFile(envFileFsPath);
        return parse(data);
    }

    public static async workspaceHasEnvFile(): Promise<boolean> {
        const envFileUris: Uri[] = await workspace.findFiles(allEnvFilesGlobPattern);
        return !!envFileUris.length;
    }

    // Todo: It might be nice to add a direct command to update just the environment variables rather than having to suggest to re-run the entire command again
    private outputLogs(context: EnvironmentVariablesContext, setEnvironmentVariableOption: SetEnvironmentVariableOption): void {
        context.telemetry.properties.setEnvironmentVariableOption = setEnvironmentVariableOption;

        if (setEnvironmentVariableOption !== SetEnvironmentVariableOption.ProvideFile) {
            context.activityChildren?.push(
                new GenericTreeItem(undefined, {
                    contextValue: createActivityChildContext(['environmentVariablesListStep', setEnvironmentVariableOption, activitySuccessContext]),
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
                    contextValue: createActivityChildContext(['environmentVariablesListStep', setEnvironmentVariableOption, activitySuccessContext]),
                    label: localize('saveEnvVarsLabel', 'Save environment variable configuration'),
                    iconPath: activitySuccessIcon
                })
            );

            ext.outputChannel.appendLog(localize('savedEnvVarsMessage', 'Saved environment variable configuration.'));
        }
    }
}
