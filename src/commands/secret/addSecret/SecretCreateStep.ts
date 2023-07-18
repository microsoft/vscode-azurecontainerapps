/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardExecuteStep, nonNullProp } from "@microsoft/vscode-azext-utils";
import type { Progress } from "vscode";
import { ext } from "../../../extensionVariables";
import { ContainerAppModel, getContainerEnvelopeWithSecrets } from "../../../tree/ContainerAppItem";
import { localize } from "../../../utils/localize";
import { updateContainerApp } from "../../../utils/updateContainerApp";
import type { ISecretContext } from "../ISecretContext";

export class SecretCreateStep extends AzureWizardExecuteStep<ISecretContext> {
    public priority: number = 200;

    public async execute(context: ISecretContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const containerApp: ContainerAppModel = nonNullProp(context, 'containerApp');
        const containerAppEnvelope = await getContainerEnvelopeWithSecrets(context, context.subscription, containerApp);

        containerAppEnvelope.configuration.secrets ||= [];
        containerAppEnvelope.configuration.secrets.push({
            name: context.secretName,
            value: context.secretValue
        });

        const addSecret: string = localize('addSecret', 'Add secret "{0}" to container app "{1}"', context.secretName, containerApp.name);
        const creatingSecret: string = localize('creatingSecret', 'Creating secret...');

        context.activityTitle = addSecret;
        progress.report({ message: creatingSecret });

        await updateContainerApp(context, context.subscription, containerAppEnvelope);

        const addedSecret: string = localize('addedSecret', 'Added secret "{0}" to container app "{1}"', context.secretName, containerApp.name);
        ext.outputChannel.appendLog(addedSecret);
    }

    public shouldExecute(context: ISecretContext): boolean {
        return !!context.secretName && !!context.secretValue;
    }
}
