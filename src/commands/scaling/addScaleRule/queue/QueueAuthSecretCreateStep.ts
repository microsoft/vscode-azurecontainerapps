/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardExecuteStep, nonNullProp } from "@microsoft/vscode-azext-utils";
import { Progress } from "vscode";
import { ScaleRuleTypes } from "../../../../constants";
import { ext } from "../../../../extensionVariables";
import { ContainerAppModel, getContainerEnvelopeWithSecrets } from "../../../../tree/ContainerAppItem";
import { localize } from "../../../../utils/localize";
import { updateContainerApp } from "../../../../utils/updateContainerApp";
import { IAddScaleRuleContext } from "../IAddScaleRuleContext";

export class QueueAuthSecretCreateStep extends AzureWizardExecuteStep<IAddScaleRuleContext> {
    public priority: number = 190;

    public async execute(context: IAddScaleRuleContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        progress.report({ message: localize('configuringSecret', 'Configuring secret...') });

        const containerApp: ContainerAppModel = nonNullProp(context, 'containerApp');
        const containerAppEnvelope = await getContainerEnvelopeWithSecrets(context, context.subscription, containerApp);

        containerAppEnvelope.configuration.secrets ||= [];
        containerAppEnvelope.configuration.secrets.push({
            name: nonNullProp(context, 'newSecretName'),
            value: nonNullProp(context, 'newSecretValue')
        });

        await updateContainerApp(context, context.subscription, containerAppEnvelope);

        const addedSecret: string = localize('addedSecret', 'Added secret "{0}" to container app "{1}"', context.newSecretName, containerApp.name);
        ext.outputChannel.appendLog(addedSecret);

        context.existingSecretName = context.newSecretName;
    }

    public shouldExecute(context: IAddScaleRuleContext): boolean {
        return context.ruleType === ScaleRuleTypes.Queue && !context.existingSecretName;
    }
}


