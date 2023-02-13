/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, DialogResponses, nonNullValue, UserCancelledError } from '@microsoft/vscode-azext-utils';
import { localize } from '../../utils/localize';
import { settingUtils } from '../../utils/settingUtils';
import { IDeleteManagedEnvironmentWizardContext } from './IDeleteManagedEnvironmentWizardContext';

export class DeleteEnvironmentConfirmationStep extends AzureWizardPromptStep<IDeleteManagedEnvironmentWizardContext> {
    private managedEnvironmentName: string | undefined;

    public async prompt(context: IDeleteManagedEnvironmentWizardContext): Promise<void> {
        this.managedEnvironmentName = context.managedEnvironmentName;

        const numOfResources = context.containerAppNames.length;
        const hasNoResources: boolean = !numOfResources;

        const deleteEnv: string = localize('confirmDeleteManagedEnv', 'Are you sure you want to delete Container Apps environment "{0}"?', context.managedEnvironmentName);
        const deleteEnvAndApps: string = localize('confirmDeleteEnvAndApps', 'Are you sure you want to delete Container Apps environment "{0}"? Deleting this will delete {1} Container App(s) in this environment.',
            this.managedEnvironmentName, numOfResources);

        const deleteConfirmation: string | undefined = settingUtils.getWorkspaceSetting('deleteConfirmation');
        if (deleteConfirmation === 'ClickButton') {
            const message: string = hasNoResources ? deleteEnv : deleteEnvAndApps;
            await context.ui.showWarningMessage(message, { modal: true, stepName: 'confirmDelete' }, DialogResponses.deleteResponse); // no need to check result - cancel will throw error
        } else {
            const prompt: string = localize('enterToDelete', 'Enter "{0}" to delete this Container Apps environment. Deleting this will delete {1} Container App(s) in this environment.',
                this.managedEnvironmentName, numOfResources);

            const result: string = await context.ui.showInputBox({
                prompt,
                validateInput: (val: string | undefined) => this.validateInput(val, prompt)
            });
            if (!this.isNameEqualToEnvironment(result)) { // Check again just in case `validateInput` didn't prevent the input box from closing
                context.telemetry.properties.cancelStep = 'mismatchDelete';
                throw new UserCancelledError();
            }
        }
    }

    public shouldPrompt(): boolean {
        return true;
    }

    private validateInput(val: string | undefined, prompt: string): string | undefined {
        return this.isNameEqualToEnvironment(val) ? undefined : prompt;
    }

    private isNameEqualToEnvironment(val: string | undefined): boolean {
        return !!val && val.toLowerCase() === nonNullValue(this.managedEnvironmentName).toLowerCase();
    }
}
