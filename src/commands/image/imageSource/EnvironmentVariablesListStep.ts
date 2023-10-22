/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzExtFsExtra, AzureWizardPromptStep, GenericTreeItem } from "@microsoft/vscode-azext-utils";
import { DotenvParseOutput, parse } from "dotenv";
import { Uri, workspace } from "vscode";
import { ImageSource, activitySuccessContext, activitySuccessIcon, envGlobPattern } from "../../../constants";
import { ext } from "../../../extensionVariables";
import { createActivityChildContext } from "../../../utils/activity/activityUtils";
import { localize } from "../../../utils/localize";
import { selectWorkspaceFile } from "../../../utils/workspaceUtils";
import type { ImageSourceBaseContext } from "./ImageSourceBaseContext";

enum SetEnvironmentVariableOption {
    NoDotEnv = 'noDotEnv',
    SkipForNow = 'skipForNow',
    ProvideFile = 'provideFile'
}

const allEnvGlobPattern: string = `**/${envGlobPattern}`;

export class EnvironmentVariablesListStep extends AzureWizardPromptStep<ImageSourceBaseContext> {
    public async prompt(context: ImageSourceBaseContext): Promise<void> {
        const envData: DotenvParseOutput | undefined = await this.selectEnvironmentSettings(context);
        if (!envData) {
            context.environmentVariables = [];
            this.outputLogs(context, SetEnvironmentVariableOption.SkipForNow);
        } else {
            context.environmentVariables = Object.keys(envData).map(name => { return { name, value: envData[name] } });
            this.outputLogs(context, SetEnvironmentVariableOption.ProvideFile);
        }
    }

    public async configureBeforePrompt(context: ImageSourceBaseContext): Promise<void> {
        if (context.environmentVariables?.length === 0) {
            this.outputLogs(context, SetEnvironmentVariableOption.NoDotEnv);
        }
    }

    public shouldPrompt(context: ImageSourceBaseContext): boolean {
        return context.imageSource !== ImageSource.QuickStartImage && context.environmentVariables === undefined;
    }

    private async selectEnvironmentSettings(context: ImageSourceBaseContext): Promise<DotenvParseOutput | undefined> {
        const placeHolder: string = localize('setEnvVar', 'Select a {0} file to set the environment variables for the container instance', '.env');
        const envFileFsPath: string | undefined = await selectWorkspaceFile(context, placeHolder,
            { filters: { 'env file': ['env', 'env.*'] }, allowSkip: true }, allEnvGlobPattern);

        if (!envFileFsPath) {
            return undefined;
        }

        const data = await AzExtFsExtra.readFile(envFileFsPath);
        return parse(data);
    }

    public static async workspaceHasEnvFile(): Promise<boolean> {
        const envFileUris: Uri[] = await workspace.findFiles(allEnvGlobPattern);
        return !!envFileUris.length;
    }

    // Todo: It might be nice to add a direct command to update just the environment variables rather than having to suggest to re-run the entire command again
    private outputLogs(context: ImageSourceBaseContext, setEnvironmentVariableOption: SetEnvironmentVariableOption): void {
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
