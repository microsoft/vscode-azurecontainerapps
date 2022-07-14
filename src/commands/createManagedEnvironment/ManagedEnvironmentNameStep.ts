/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from "@microsoft/vscode-azext-utils";
import { localize } from "../../utils/localize";
import { IManagedEnvironmentContext } from './IManagedEnvironmentContext';

export class ManagedEnvironmentNameStep extends AzureWizardPromptStep<IManagedEnvironmentContext> {
    public async prompt(context: IManagedEnvironmentContext): Promise<void> {
        const prompt: string = localize('containerAppNamePrompt', 'Enter a name for the new Container Apps environment.');
        context.newManagedEnvironmentName = (await context.ui.showInputBox({
            prompt,
            validateInput: async (value: string | undefined): Promise<string | undefined> => await this.validateInput(value)
        })).trim();

        context.valuesToMask.push(context.newManagedEnvironmentName);
    }

    public shouldPrompt(context: IManagedEnvironmentContext): boolean {
        return !context.managedEnvironment;
    }

    private async validateInput(name: string | undefined): Promise<string | undefined> {
        name = name ? name.trim() : '';

        const { minLength, maxLength } = { minLength: 4, maxLength: 20 };
        if (!/^[a-z]([-a-z0-9]*[a-z0-9])?$/.test(name)) {
            return localize('invalidChar', `A name must consist of lower case alphanumeric characters or '-', start with an alphabetic character, and end with an alphanumeric character and cannot have '--'.`);
        } else if ((name.length < minLength) || name.length > maxLength) {
            return localize('invalidLength', 'The name must be between {0} and {1} characters.', minLength, maxLength);
        }

        return undefined;
    }
}
