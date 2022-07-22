/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Secret } from '@azure/arm-appcontainers';
import { AzureWizardPromptStep, nonNullProp } from '@microsoft/vscode-azext-utils';
import { QuickPickItem } from 'vscode';
import { ContainerAppTreeItem } from '../../../../tree/ContainerAppTreeItem';
import { RevisionTreeItem } from '../../../../tree/RevisionTreeItem';
import { ScaleRuleGroupTreeItem } from '../../../../tree/ScaleRuleGroupTreeItem';
import { IAddScaleRuleWizardContext } from '../IAddScaleRuleWizardContext';

export class QueueAuthSecretStep extends AzureWizardPromptStep<IAddScaleRuleWizardContext> {
    public async prompt(context: IAddScaleRuleWizardContext): Promise<void> {
        const node: ScaleRuleGroupTreeItem = context.treeItem;
        const containerApp: ContainerAppTreeItem = node.parent.parent instanceof RevisionTreeItem ? node.parent.parent.parent.parent : node.parent.parent;
        const containerAppWithSecrets = await containerApp.getContainerEnvelopeWithSecrets(context);
        const secrets: Secret[] | undefined = containerAppWithSecrets.configuration.secrets;
        const qpItems: QuickPickItem[] = secrets?.map((secret) => {
            return { label: nonNullProp(secret, "name") };
        }) || [];
        context.secretRef = (await context.ui.showQuickPick(qpItems, {})).label;
    }

    public shouldPrompt(): boolean {
        return true;
    }
}

