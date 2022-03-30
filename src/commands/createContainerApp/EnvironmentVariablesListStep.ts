/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzExtFsExtra, AzureWizardPromptStep } from "@microsoft/vscode-azext-utils";
import { parse } from "dotenv";
import { localize } from "../../utils/localize";
import { selectWorkspaceFile } from "../../utils/workspaceUtils";
import { IContainerAppContext } from "./IContainerAppContext";

const skipForNowLabel: string = localize('skipForNow', '$(clock) Skip for now');

export class EnvironmentVariablesListStep extends AzureWizardPromptStep<IContainerAppContext> {
    public async prompt(context: IContainerAppContext): Promise<void> {
        const input = await context.ui.showQuickPick([{ label: localize('set', 'Set with environment variable file') }, { label: skipForNowLabel }],
            { placeHolder: localize('setEnvVar', 'Set environment variables in container instance') });

        if (input.label !== skipForNowLabel) {
            const envData = await this.selectEnvironmentSettings(context);
            context.environmentVariables = Object.keys(envData).map(name => { return { name, value: envData[name] } });
        }

    }

    public shouldPrompt(context: IContainerAppContext): boolean {
        return context.environmentVariables === undefined;
    }

    private async selectEnvironmentSettings(context: IContainerAppContext) {
        const envFileFsPath: string = await selectWorkspaceFile(context, 'Select a .env file', { filters: { 'env file': ['env', 'env.*'] } }, '**/*.{env,env.*}');
        const data = await AzExtFsExtra.readFile(envFileFsPath);
        return parse(data);
    }
}
