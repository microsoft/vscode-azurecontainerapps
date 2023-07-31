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

export class SecretDeleteStep extends AzureWizardExecuteStep<ISecretContext> {
    public priority: number = 200;

    public async execute(context: ISecretContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const containerApp: ContainerAppModel = nonNullProp(context, 'containerApp');
        const secretName: string = nonNullProp(context, 'existingSecretName');
        const containerAppEnvelope = await getContainerEnvelopeWithSecrets(context, context.subscription, containerApp);

        containerAppEnvelope.configuration.secrets ||= [];
        containerAppEnvelope.configuration.secrets = containerAppEnvelope.configuration.secrets.filter((secret) => secret.name !== secretName);

        const deleteSecret: string = localize('deleteSecret', 'Delete secret "{0}" for container app "{1}"', secretName, containerApp.name);
        const deletingSecret: string = localize('deletingSecret', 'Deleting secret...');

        context.activityTitle = deleteSecret;
        progress.report({ message: deletingSecret });

        await updateContainerApp(context, context.subscription, containerAppEnvelope);

        const deletedSecret: string = localize('deletedSecret', 'Deleted secret "{0}" for container app "{1}"', secretName, containerApp.name);
        ext.outputChannel.appendLog(deletedSecret);
        ext.state.notifyChildrenChanged(containerApp.managedEnvironmentId);
    }

    public shouldExecute(context: ISecretContext): boolean {
        return !!context.existingSecretName;
    }
}
