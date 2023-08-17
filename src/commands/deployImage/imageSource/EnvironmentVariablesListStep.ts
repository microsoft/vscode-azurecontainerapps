/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzExtFsExtra, AzureWizardPromptStep, GenericTreeItem, createContextValue } from "@microsoft/vscode-azext-utils";
import { randomUUID } from "crypto";
import { parse } from "dotenv";
import { ThemeColor, ThemeIcon, Uri, workspace } from "vscode";
import { ImageSource, activitySuccessContext } from "../../../constants";
import { ext } from "../../../extensionVariables";
import { localize } from "../../../utils/localize";
import { selectWorkspaceFile } from "../../../utils/workspaceUtils";
import type { ImageSourceBaseContext } from "./ImageSourceBaseContext";

const skipForNowLabel: string = localize('skipForNow', '$(clock) Skip for now');
const allEnvFilesGlobPattern: string = '**/*.{env,env.*}';

export class EnvironmentVariablesListStep extends AzureWizardPromptStep<ImageSourceBaseContext> {
    public async prompt(context: ImageSourceBaseContext): Promise<void> {
        const input = await context.ui.showQuickPick([{ label: localize('set', 'Set with environment variable file') }, { label: skipForNowLabel }],
            { placeHolder: localize('setEnvVar', 'Set environment variables in container instance') });

        if (input.label === skipForNowLabel) {
            context.environmentVariables = [];
        } else {
            const envData = await this.selectEnvironmentSettings(context);
            context.environmentVariables = Object.keys(envData).map(name => { return { name, value: envData[name] } });
        }
    }

    public async configureBeforePrompt(context: ImageSourceBaseContext): Promise<void> {
        if (context.environmentVariables?.length === 0) {
            if (context.activityChildren) {
                context.activityChildren.push(
                    new GenericTreeItem(undefined, {
                        contextValue: createContextValue(['environmentVariablesListStep', activitySuccessContext, randomUUID()]),
                        label: localize('skipEnvVarsLabel', 'Skip environment variable configuration (no .env files found)'),
                        iconPath: new ThemeIcon('pass', new ThemeColor('testing.iconPassed'))
                    })
                );
            }

            // Todo: We should try to add a direct command to update just the environment variables before release. Running the entire update image command is a lot of work for such a small change
            const noEnvFilesDetected: string = localize('skipEnvVarsLog', `Skipped environment variable configuration for the container app because no .env files were detected.\n
                If you would like to update your environment variables later, try running 'Update Container App Image...' followed by 'Deploy unsaved changes...'`);
            ext.outputChannel.appendLog(noEnvFilesDetected);
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
}
