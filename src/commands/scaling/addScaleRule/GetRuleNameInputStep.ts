/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerApp, ContainerAppsAPIClient, ScaleRule } from '@azure/arm-appcontainers';
import { AzureWizardPromptStep } from '@microsoft/vscode-azext-utils';
import { createContainerAppsAPIClient } from '../../../utils/azureClients';
import { getResourceGroupFromId } from '../../../utils/azureUtils';
import { localize } from '../../../utils/localize';
import { IAddScaleRuleWizardContext } from './IAddScaleRuleWizardContext';

export class GetRuleNameInputStep extends AzureWizardPromptStep<IAddScaleRuleWizardContext> {
    public async prompt(context: IAddScaleRuleWizardContext): Promise<void> {
        context.ruleName = await context.ui.showInputBox({
            prompt: localize('scaleRuleNamePrompt', 'Enter a name for the new scale rule.'),
            validateInput: async (value: string | undefined): Promise<string | undefined> => await this.validateInput(context, value)
        });
        try {
            const client: ContainerAppsAPIClient = await createContainerAppsAPIClient([context, context.treeItem]);
            const containerAppRg: string = getResourceGroupFromId(context.treeItem.fullId);
            const containerApp: ContainerApp = await client.containerApps.get(containerAppRg, context.treeItem.parent.parent.label);
            const scaleRules: ScaleRule[] | undefined = containerApp?.template?.scale?.rules;
            const scaleRuleExists = !!(scaleRules?.filter((rule) => {
                return rule?.name?.length && rule?.name === context?.ruleName;
            }).length);
            if (scaleRuleExists) { /* Duplicate logic goes here */ }
        } catch (err) { /* TBD */ }
    }

    public shouldPrompt(): boolean {
        return true;
    }

    private async validateInput(_context: IAddScaleRuleWizardContext, name: string | undefined): Promise<string | undefined> {
        name = name ? name.trim() : '';

        const { minLength, maxLength } = { minLength: 2, maxLength: 20 };
        if (!/^[a-z]([-a-z0-9]*[a-z0-9])?$/.test(name)) {
            return localize('invalidChar', `A name must consist of lower case alphanumeric characters or '-', and must start and end with an alphanumeric character.`);
        } else if (name.length < minLength || name.length > maxLength) {
            return localize('invalidLength', 'The name must be between {0} and {1} characters.', minLength, maxLength);
        }

        return undefined;
    }
}

