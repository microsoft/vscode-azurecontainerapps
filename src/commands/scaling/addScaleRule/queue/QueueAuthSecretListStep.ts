/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { Secret } from '@azure/arm-appcontainers';
import { AzureWizardPromptStep, IAzureQuickPickItem, IWizardOptions, nonNullProp } from '@microsoft/vscode-azext-utils';
import { getContainerEnvelopeWithSecrets } from '../../../../tree/ContainerAppItem';
import { localize } from '../../../../utils/localize';
import { SecretNameStep } from '../../../secret/addSecret/SecretNameStep';
import { SecretValueStep } from '../../../secret/addSecret/SecretValueStep';
import type { IAddScaleRuleContext } from '../IAddScaleRuleContext';
import { QueueAuthSecretCreateStep } from './QueueAuthSecretCreateStep';

export class QueueAuthSecretListStep extends AzureWizardPromptStep<IAddScaleRuleContext> {
    public async prompt(context: IAddScaleRuleContext): Promise<void> {
        const containerAppWithSecrets = await getContainerEnvelopeWithSecrets(context, context.subscription, context.containerApp);

        const secrets: Secret[] = containerAppWithSecrets.configuration.secrets ?? [];

        const picks: IAzureQuickPickItem<string | undefined>[] = [
            { label: localize('createSecret', '$(plus) Create a secret'), data: undefined },
            ...secrets.map((secret) => {
                const secretName: string = nonNullProp(secret, "name");
                return { label: secretName, data: secretName };
            })
        ]

        context.existingSecretName = (await context.ui.showQuickPick(picks, {
            placeHolder: localize('chooseSecretRef', 'Choose a secret reference')
        })).data;
    }

    public shouldPrompt(context: IAddScaleRuleContext): boolean {
        return !context.existingSecretName;
    }

    public async getSubWizard(context: IAddScaleRuleContext): Promise<IWizardOptions<IAddScaleRuleContext> | undefined> {
        if (context.existingSecretName) {
            return undefined;
        }

        return {
            promptSteps: [new SecretNameStep(), new SecretValueStep()],
            executeSteps: [new QueueAuthSecretCreateStep()]
        };
    }
}

