/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from '@microsoft/vscode-azext-utils';
import { localize } from '../../utils/localize';
import { type LogAnalyticsContext } from './LogAnalyticsContext';

export class LogAnalyticsNameStep extends AzureWizardPromptStep<LogAnalyticsContext> {
    public async prompt(context: LogAnalyticsContext): Promise<void> {
        context.newLogAnalyticsWorkspaceName = (await context.ui.showInputBox({
            prompt: localize('logAnalyticsNamePrompt', 'Enter a log analytics workspace name.'),
            value: context.managedEnvironment.name,
            validateInput: LogAnalyticsNameStep.validateInput,
        })).trim();
        context.valuesToMask.push(context.newLogAnalyticsWorkspaceName);
    }

    public shouldPrompt(context: LogAnalyticsContext): boolean {
        return !context.logAnalyticsWorkspace && !context.newLogAnalyticsWorkspaceName;
    }

    public static validateInput(name: string | undefined): string | undefined {
        name = name?.trim() ?? '';
        if (name.length < 4 || name.length > 63) {
            return localize('logAnalyticsNameLength', 'The name must be between 4 and 63 characters.');
        }
        if (!/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]$/.test(name)) {
            return localize('logAnalyticsNameCharacters', 'The name must contain only alphanumeric characters or hyphens, and start and end with an alphanumeric character.');
        }
        return undefined;
    }
}
