/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardExecuteStepWithActivityOutput, nonNullProp } from "@microsoft/vscode-azext-utils";
import { type Progress } from "vscode";
import { getContainerEnvelopeWithSecrets, type ContainerAppModel } from "../../../tree/ContainerAppItem";
import { localize } from "../../../utils/localize";
import { updateContainerApp } from "../../updateContainerApp";
import { type ISecretContext } from "../ISecretContext";

export class SecretCreateStep<T extends ISecretContext> extends AzureWizardExecuteStepWithActivityOutput<T> {
    public priority: number = 820;
    public stepName: string = 'secretCreateStep';
    protected getOutputLogSuccess = (context: T) => localize('createSecretSuccess', 'Successfully created secret "{0}" for container app "{1}".', context.secretName, context.containerApp?.name);
    protected getOutputLogFail = (context: T) => localize('createSecretFail', 'Failed to create secret "{0}" for container app "{1}".', context.newSecretName, context.containerApp?.name);
    protected getTreeItemLabel = (context: T) => localize('createSecretLabel', 'Create secret "{0}" for container app "{1}"', context.secretName, context.containerApp?.name);

    public async execute(context: ISecretContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const containerApp: ContainerAppModel = nonNullProp(context, 'containerApp');
        const containerAppEnvelope = await getContainerEnvelopeWithSecrets(context, context.subscription, containerApp);

        containerAppEnvelope.configuration.secrets ||= [];
        containerAppEnvelope.configuration.secrets.push({
            name: context.newSecretName,
            value: context.newSecretValue
        });

        const creatingSecret: string = localize('creatingSecret', 'Creating secret...');
        progress.report({ message: creatingSecret });

        await updateContainerApp(context, context.subscription, containerAppEnvelope);
        context.secretName = context.newSecretName;
    }

    public shouldExecute(context: ISecretContext): boolean {
        return !!context.newSecretName && !!context.newSecretValue;
    }
}
