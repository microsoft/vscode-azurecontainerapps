/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerAppsAPIClient } from '@azure/arm-appcontainers';
import { uiUtils } from '@microsoft/vscode-azext-azureutils';
import { AzureWizardExecuteStep, AzureWizardPromptStep, DialogResponses, IWizardOptions, UserCancelledError } from '@microsoft/vscode-azext-utils';
import { createContainerAppsAPIClient } from '../../../utils/azureClients';
import { localize } from '../../../utils/localize';
import { settingUtils } from '../../../utils/settingUtils';
import { IDeleteWizardContext } from '../../IDeleteWizardContext';
import { DeleteContainerAppsDeleteStep } from './AllContainerAppsDeleteStep';

export class PromptDeleteStep extends AzureWizardPromptStep<IDeleteWizardContext> {
    public async prompt(context: IDeleteWizardContext): Promise<void> {
        const client: ContainerAppsAPIClient = await createContainerAppsAPIClient([context, context.subscription]);
        const node = context.node;
        context.containerApps = (await uiUtils.listAllIterator(client.containerApps.listBySubscription()))
            .filter(ca => ca.managedEnvironmentId && ca.managedEnvironmentId === node.id);

        const numOfResources = context.containerApps.length;
        const hasNoResources: boolean = !numOfResources;

        const deleteEnv: string = localize('ConfirmDeleteManagedEnv', 'Are you sure you want to delete Container Apps environment "{0}"?', node.name);
        const deleteEnvAndApps: string = localize('ConfirmDeleteEnvAndApps', 'Are you sure you want to delete Container Apps environment "{0}"? Deleting this will delete {1} container app(s) in this environment.',
            node.name, numOfResources);

        const deleteConfirmation: string | undefined = settingUtils.getWorkspaceSetting('deleteConfirmation');
        if (deleteConfirmation === 'ClickButton' || hasNoResources) {
            const message: string = hasNoResources ? deleteEnv : deleteEnvAndApps;
            await context.ui.showWarningMessage(message, { modal: true, stepName: 'confirmDelete' }, DialogResponses.deleteResponse); // no need to check result - cancel will throw error
        } else {
            const prompt: string = localize('enterToDelete', 'Enter "{0}" to delete this Container Apps environment. Deleting this will delete {1} container app(s) in this environment.',
                node.name, numOfResources);

            const result: string = await context.ui.showInputBox({ prompt, validateInput });
            if (!isNameEqual(result, node.name)) { // Check again just in case `validateInput` didn't prevent the input box from closing
                context.telemetry.properties.cancelStep = 'mismatchDelete';
                throw new UserCancelledError();
            }

            function validateInput(val: string | undefined): string | undefined {
                return isNameEqual(val, node.name) ? undefined : prompt;
            }

            function isNameEqual(val: string | undefined, name: string): boolean {
                return !!val && val.toLowerCase() === name.toLowerCase();
            }
        }
    }

    public async getSubWizard(context: IDeleteWizardContext): Promise<IWizardOptions<IDeleteWizardContext> | undefined> {
        if (context.containerApps) {
            const executeSteps: AzureWizardExecuteStep<IDeleteWizardContext>[] = [new DeleteContainerAppsDeleteStep()];
            return { promptSteps: [], executeSteps }
        }

        return undefined;

    }

    public shouldPrompt(): boolean {
        return true;
    }
}
