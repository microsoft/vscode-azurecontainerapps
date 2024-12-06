/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type Secret } from '@azure/arm-appcontainers';
import { AzureWizardPromptStep, nonNullProp, type IAzureQuickPickItem, type IWizardOptions } from '@microsoft/vscode-azext-utils';
import { noMatchingResources, noMatchingResourcesQp } from '../../constants';
import { getContainerEnvelopeWithSecrets, type ContainerAppModel } from '../../tree/ContainerAppItem';
import { localize } from '../../utils/localize';
import { type ISecretContext } from './ISecretContext';
import { SecretCreateStep } from './addSecret/SecretCreateStep';
import { SecretNameStep } from './addSecret/SecretNameStep';
import { SecretValueStep } from './addSecret/SecretValueStep';

export interface SecretListStepOptions {
    suppressCreatePick?: boolean;
}

export class SecretListStep extends AzureWizardPromptStep<ISecretContext> {
    constructor(private readonly options?: SecretListStepOptions) {
        super();
    }

    public async prompt(context: ISecretContext): Promise<void> {
        const containerApp: ContainerAppModel = nonNullProp(context, 'containerApp');
        const containerAppWithSecrets = await getContainerEnvelopeWithSecrets(context, context.subscription, containerApp);

        const secrets: Secret[] = containerAppWithSecrets.configuration.secrets ?? [];
        const picks: IAzureQuickPickItem<string | undefined>[] = [];

        if (!this.options?.suppressCreatePick) {
            picks.push({ label: localize('createSecret', '$(plus) Create a secret'), data: undefined });
        }

        picks.push(
            ...secrets.map((secret) => {
                const secretName: string = nonNullProp(secret, "name");
                return { label: secretName, data: secretName };
            })
        );

        if (!picks.length) {
            picks.push(noMatchingResourcesQp);
        }

        do {
            context.secretName = (await context.ui.showQuickPick(picks, {
                placeHolder: localize('chooseSecretRef', 'Choose a secret')
            })).data;
        } while (context.secretName === noMatchingResources);
    }

    public shouldPrompt(context: ISecretContext): boolean {
        return !context.secretName;
    }

    public async getSubWizard(context: ISecretContext): Promise<IWizardOptions<ISecretContext> | undefined> {
        if (context.secretName) {
            return undefined;
        }

        return {
            promptSteps: [new SecretNameStep(), new SecretValueStep()],
            executeSteps: [new SecretCreateStep()]
        };
    }
}
