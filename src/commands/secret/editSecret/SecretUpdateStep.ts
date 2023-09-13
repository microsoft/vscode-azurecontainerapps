/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardExecuteStep, nonNullProp, nonNullValue } from "@microsoft/vscode-azext-utils";
import type { Progress } from "vscode";
import { ext } from "../../../extensionVariables";
import { ContainerAppModel, getContainerEnvelopeWithSecrets } from "../../../tree/ContainerAppItem";
import { localize } from "../../../utils/localize";
import { updateContainerApp } from "../../../utils/updateContainerApp";
import type { ISecretContext } from "../ISecretContext";

export class SecretUpdateStep extends AzureWizardExecuteStep<ISecretContext> {
    public priority: number = 850;

    public async execute(context: ISecretContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const containerApp: ContainerAppModel = nonNullProp(context, 'containerApp');
        const containerAppEnvelope = await getContainerEnvelopeWithSecrets(context, context.subscription, containerApp);

        let updatedSecret: string | undefined;
        if (context.newSecretName) {
            context.activityTitle = localize('updatingSecretName', 'Update secret name from "{0}" to "{1}" in container app "{2}"', context.existingSecretName, context.newSecretName, containerApp.name);
            updatedSecret = localize('updatedSecretName', 'Updated secret name from "{0}" to "{1}" in container app "{2}".', context.existingSecretName, context.newSecretName, containerApp.name);
        } else if (context.newSecretValue) {
            updatedSecret = localize('updatedSecretValue', 'Updated secret value for "{0}" in container app "{1}".', context.existingSecretName, containerApp.name);
        }

        progress.report({ message: localize('updatingSecret', 'Updating secret...') });

        let didUpdateSecret: boolean = false;
        containerAppEnvelope.configuration.secrets ||= [];
        containerAppEnvelope.configuration.secrets.forEach((secret) => {
            if (secret.name === context.existingSecretName) {
                secret.name = context.newSecretName ?? secret.name;
                secret.value = context.newSecretValue ?? secret.value;
                didUpdateSecret = true;
            }
        });

        if (!didUpdateSecret) {
            throw new Error(localize('noMatchingSecret', 'No matching secret named "{0}" found for container app "{1}".', context.existingSecretName, containerApp.name));
        }

        await updateContainerApp(context, context.subscription, containerAppEnvelope);

        ext.outputChannel.appendLog(nonNullValue(updatedSecret));
    }

    public shouldExecute(context: ISecretContext): boolean {
        return !!context.existingSecretName && (!!context.newSecretName || !!context.newSecretValue);
    }
}
