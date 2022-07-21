/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from '@microsoft/vscode-azext-utils';
import { ContainerAppTreeItem } from '../../../../tree/ContainerAppTreeItem';
import { RevisionTreeItem } from '../../../../tree/RevisionTreeItem';
import { ScaleRuleGroupTreeItem } from '../../../../tree/ScaleRuleGroupTreeItem';
import { localize } from '../../../../utils/localize';
import { IAddScaleRuleWizardContext } from '../IAddScaleRuleWizardContext';

export class GetQueueAuthStep extends AzureWizardPromptStep<IAddScaleRuleWizardContext> {
    public async prompt(context: IAddScaleRuleWizardContext): Promise<void> {
        const node: ScaleRuleGroupTreeItem = context.treeItem;
        const containerApp: ContainerAppTreeItem = node.parent.parent instanceof RevisionTreeItem ? node.parent.parent.parent.parent : node.parent.parent;
        const containerAppWithSecrets = await containerApp.getContainerEnvelopeWithSecrets(context);
        const secrets = containerAppWithSecrets.configuration.secrets;

        console.log(secrets);

        const authSecret: string = (await context.ui.showInputBox({
            prompt: localize('queueAuthSecrets', 'Enter authentication.'),
            validateInput: async (value: string | undefined): Promise<string | undefined> => await this.validateInput(value)
        })).trim();
        console.log(authSecret);
    }

    public shouldPrompt(): boolean {
        return true;
    }

    private async validateInput(secret: string | undefined): Promise<string | undefined> {
        secret = secret ? secret.trim() : '';

        if (!/^[1-9]+[0-9]*$/.test(secret)) {
            return localize('invalidAuthSecret', 'Auth secret is invalid.');
        }
        return undefined;
    }
}

