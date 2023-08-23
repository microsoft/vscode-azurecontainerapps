/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzExtFsExtra, AzureWizardPromptStep, GenericTreeItem } from "@microsoft/vscode-azext-utils";
import { parse } from "dotenv";
import { ThemeColor, ThemeIcon, Uri, workspace } from "vscode";
import { ImageSource, activitySuccessContext } from "../../../constants";
import { ext } from "../../../extensionVariables";
import { createActivityChildContext } from "../../../utils/createActivityChildContext";
import { localize } from "../../../utils/localize";
import { selectWorkspaceFile } from "../../../utils/workspaceUtils";
import type { ImageSourceBaseContext } from "./ImageSourceBaseContext";

enum SetEnvironmentVariableOption {
    NoDotEnv = 'noDotEnv',
    SkipForNow = 'skipForNow',
    ProvideFile = 'provideFile'
}

const skipForNowLabel: string = localize('skipForNow', '$(clock) Skip for now');
const allEnvFilesGlobPattern: string = '**/*.{env,env.*}';

export class EnvironmentVariablesListStep extends AzureWizardPromptStep<ImageSourceBaseContext> {
    public async prompt(context: ImageSourceBaseContext): Promise<void> {
        const input = await context.ui.showQuickPick([{ label: localize('set', 'Set with environment variable file') }, { label: skipForNowLabel }],
            { placeHolder: localize('setEnvVar', 'Set environment variables in container instance') });

        if (input.label === skipForNowLabel) {
            context.environmentVariables = [];
            this.outputLogs(context, SetEnvironmentVariableOption.SkipForNow);
        } else {
            const envData = await this.selectEnvironmentSettings(context);
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

    private async selectEnvironmentSettings(context: ImageSourceBaseContext) {
        const envFileFsPath: string = await selectWorkspaceFile(context, 'Select a .env file', { filters: { 'env file': ['env', 'env.*'] } }, allEnvFilesGlobPattern);
        const data = await AzExtFsExtra.readFile(envFileFsPath);
        return parse(data);
    }

    public static async workspaceHasEnvFile(): Promise<boolean> {
        const envFileUris: Uri[] = await workspace.findFiles(allEnvFilesGlobPattern);
        return !!envFileUris.length;
    }

    // Todo: We should try to add a direct command to update just the environment variables before release. Running the entire update image command is a lot of work for such a small change
    private outputLogs(context: ImageSourceBaseContext, setEnvironmentVariableOption: SetEnvironmentVariableOption): void {
        let logMessage: string | undefined;
        if (setEnvironmentVariableOption !== SetEnvironmentVariableOption.ProvideFile) {
            context.activityChildren?.push(
                new GenericTreeItem(undefined, {
                    contextValue: createActivityChildContext(context.activityChildren.length, ['environmentVariablesListStep', setEnvironmentVariableOption, activitySuccessContext]),
                    label: localize('skipEnvVarsLabel',
                        'Skip environment variable configuration' +
                        (setEnvironmentVariableOption === SetEnvironmentVariableOption.NoDotEnv ? ' (no .env files found)' : '')
                    ),
                    iconPath: new ThemeIcon('pass', new ThemeColor('testing.iconPassed'))
                })
            );

            logMessage = localize('skippedEnvVarsMessage',
                'Skipped environment variable configuration for the container app' +
                (setEnvironmentVariableOption === SetEnvironmentVariableOption.NoDotEnv ? ' because no .env files were detected. ' : '. ') +
                'If you would like to update your environment variables later, try re-running with the "Update Container App Image..." command.'
            );
        } else {
            context.activityChildren?.push(
                new GenericTreeItem(undefined, {
                    contextValue: createActivityChildContext(context.activityChildren.length, ['environmentVariablesListStep', setEnvironmentVariableOption, activitySuccessContext]),
                    label: localize('configureEnvVarsLabel', 'Configure environment variables for the container app'),
                    iconPath: new ThemeIcon('pass', new ThemeColor('testing.iconPassed'))
                })
            );

            logMessage = localize('configuredEnvVarsMessage', 'Configured environment variables for the container app.');
        }

        ext.outputChannel.appendLog(logMessage);
    }

}

