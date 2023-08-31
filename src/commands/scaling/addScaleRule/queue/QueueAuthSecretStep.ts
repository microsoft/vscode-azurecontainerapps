/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { Secret } from '@azure/arm-appcontainers';
import { AzureWizardPromptStep, nonNullProp } from '@microsoft/vscode-azext-utils';
import type { QuickPickItem } from 'vscode';
import { getContainerEnvelopeWithSecrets } from '../../../../tree/ContainerAppItem';
import { localize } from '../../../../utils/localize';
import type { IAddScaleRuleContext } from '../IAddScaleRuleContext';

export class QueueAuthSecretStep extends AzureWizardPromptStep<IAddScaleRuleContext> {
    public async prompt(context: IAddScaleRuleContext): Promise<void> {
        const placeHolder: string = localize('chooseSecretRef', 'Choose a secret reference');
        const containerAppWithSecrets = await getContainerEnvelopeWithSecrets(context, context.subscription, context.containerApp);
        const secrets: Secret[] | undefined = containerAppWithSecrets.configuration.secrets;
        if (!secrets?.length) {
            const noSecrets: string = localize('noSecretsFound', 'No secrets were found. Create a secret to proceed.');
            throw new Error(noSecrets);
        }
        const qpItems: QuickPickItem[] = secrets.map((secret) => {
            return { label: nonNullProp(secret, "name") };
        });
        context.newQueueSecretRef = (await context.ui.showQuickPick(qpItems, { placeHolder })).label;
    }

    public shouldPrompt(context: IAddScaleRuleContext): boolean {
        return context.newQueueSecretRef === undefined;
    }
}
