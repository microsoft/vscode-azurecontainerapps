/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Secret } from '@azure/arm-appcontainers';
import { AzureWizardPromptStep, nonNullProp } from '@microsoft/vscode-azext-utils';
import { QuickPickItem } from 'vscode';
import { localize } from '../../../../utils/localize';
import { IAddScaleRuleWizardContext } from '../IAddScaleRuleWizardContext';

export class QueueAuthSecretStep extends AzureWizardPromptStep<IAddScaleRuleWizardContext> {
    public async prompt(context: IAddScaleRuleWizardContext): Promise<void> {
        const noSecrets: string = localize('noSecretsFound', 'No secrets were found. Create a secret to proceed.');
        const placeHolder: string = localize('chooseSecretRef', 'Choose a secret reference');
        const containerAppWithSecrets = await context.containerApp.getContainerEnvelopeWithSecrets(context);
        const secrets: Secret[] | undefined = containerAppWithSecrets.configuration.secrets;
        const qpItems: (QuickPickItem & { infoOnly?: boolean })[] = secrets?.map((secret) => {
            return { label: nonNullProp(secret, "name") };
        }) || [];
        if (!qpItems?.length) {
            qpItems.push({ label: noSecrets, infoOnly: true });
        }
        const secretRef = await context.ui.showQuickPick(qpItems, { placeHolder });
        if (secretRef.infoOnly) { throw Error(noSecrets) }
        context.queueProps.secretRef = secretRef.label;
    }

    public shouldPrompt(context: IAddScaleRuleWizardContext): boolean {
        return context.queueProps.secretRef === undefined;
    }
}

