/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode } from "@azure/arm-appcontainers";
import { uiUtils } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardExecuteStep, createSubscriptionContext, nonNullProp } from "@microsoft/vscode-azext-utils";
import { type Progress } from "vscode";
import { ext } from "../../../extensionVariables";
import { getContainerEnvelopeWithSecrets, type ContainerAppModel } from "../../../tree/ContainerAppItem";
import { createContainerAppsAPIClient } from "../../../utils/azureClients";
import { localize } from "../../../utils/localize";
import { updateContainerApp } from "../../updateContainerApp";
import { type ISecretContext } from "../ISecretContext";
import { getSecretReferenceLocations } from "./getSecretReferenceLocations";

export class SecretDeleteStep extends AzureWizardExecuteStep<ISecretContext> {
    public priority: number = 200;

    public async execute(context: ISecretContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const containerApp: ContainerAppModel = nonNullProp(context, 'containerApp');
        const secretName: string = nonNullProp(context, 'secretName');
        const containerAppEnvelope = await getContainerEnvelopeWithSecrets(context, context.subscription, containerApp);
        const revisions = containerApp.revisionsMode === KnownActiveRevisionsMode.Multiple
            ? await this.getRevisions(context, containerApp)
            : [];
        const references = getSecretReferenceLocations(secretName, containerAppEnvelope, {
            activeRevisions: revisions,
            includeCurrentTemplate: containerApp.revisionsMode === KnownActiveRevisionsMode.Single
        });

        if (references.length) {
            throw new Error(localize(
                'secretCannotBeDeleted',
                'Cannot delete secret "{0}" for container app "{1}" because it is referenced by: {2}. Remove those references and try again.',
                secretName,
                containerApp.name,
                references.join(', ')
            ));
        }

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
        return !!context.secretName;
    }

    private async getRevisions(context: ISecretContext, containerApp: ContainerAppModel) {
        const client = await createContainerAppsAPIClient([context, createSubscriptionContext(context.subscription)]);
        return uiUtils.listAllIterator(client.containerAppsRevisions.listRevisions(containerApp.resourceGroup, containerApp.name));
    }
}
