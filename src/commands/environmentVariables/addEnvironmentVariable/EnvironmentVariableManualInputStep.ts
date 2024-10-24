/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from "@microsoft/vscode-azext-utils";
import { localize } from "../../../utils/localize";
import { type EnvironmentVariableAddContext } from "./EnvironmentVariableAddContext";

export class EnvironmentVariableManualInputStep<T extends EnvironmentVariableAddContext> extends AzureWizardPromptStep<T> {
    public async prompt(context: T): Promise<void> {
        context.newEnvironmentVariableManualInput = (await context.ui.showInputBox({
            prompt: localize('envManualPrompt', 'Enter a value for the environment variable'),
        })).trim();
        context.valuesToMask.push(context.newEnvironmentVariableManualInput);
    }

    public shouldPrompt(context: T): boolean {
        return !context.newEnvironmentVariableManualInput;
    }
}
