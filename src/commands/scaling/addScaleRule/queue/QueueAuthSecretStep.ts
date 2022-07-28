/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Secret } from '@azure/arm-appcontainers';
import { AzureWizardPromptStep, nonNullProp } from '@microsoft/vscode-azext-utils';
import { QuickPickItem } from 'vscode';
import { IAddScaleRuleWizardContext } from '../IAddScaleRuleWizardContext';

export class QueueAuthSecretStep extends AzureWizardPromptStep<IAddScaleRuleWizardContext> {
    public async prompt(context: IAddScaleRuleWizardContext): Promise<void> {
        const containerAppWithSecrets = await context.containerApp.getContainerEnvelopeWithSecrets(context);
        const secrets: Secret[] | undefined = containerAppWithSecrets.configuration.secrets;
        const qpItems: QuickPickItem[] = secrets?.map((secret) => {
            return { label: nonNullProp(secret, "name") };
        }) || [];
        context.queueProps.secretRef = (await context.ui.showQuickPick(qpItems, {})).label;
    }

    public shouldPrompt(context: IAddScaleRuleWizardContext): boolean {
        return context.queueProps.secretRef === undefined;
    }
}

