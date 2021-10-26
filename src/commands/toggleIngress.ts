/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Ingress, WebSiteManagementClient } from '@azure/arm-appservice';
import { ProgressLocation, window } from 'vscode';
import { AzureWizard, AzureWizardPromptStep, IActionContext } from 'vscode-azureextensionui';
import { ext } from '../extensionVariables';
import { IngressDisabledTreeItem, IngressTreeItem } from '../tree/IngressTreeItem';
import { createWebSiteClient } from '../utils/azureClients';
import { localize } from '../utils/localize';
import { EnableIngressStep } from './createContainerApp/EnableIngressStep';
import { IContainerAppContext } from './createContainerApp/IContainerAppContext';

export async function toggleIngress(context: IActionContext, node?: IngressTreeItem | IngressDisabledTreeItem): Promise<void> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<IngressTreeItem | IngressDisabledTreeItem>([IngressTreeItem.contextValue, IngressDisabledTreeItem.contextValue], context);
    }

    let ingress: Ingress | undefined = {};

    if (node instanceof IngressTreeItem) {
        ingress = undefined;
    } else {
        const title: string = localize('enableIngress', 'Enable Ingress');
        const promptSteps: AzureWizardPromptStep<IContainerAppContext>[] = [new EnableIngressStep()];

        const wizardContext: IContainerAppContext = { ...context, ...node.subscription };
        const wizard: AzureWizard<IContainerAppContext> = new AzureWizard(wizardContext, {
            title,
            promptSteps,
            executeSteps: []
        });

        wizardContext.enableIngress = true;
        await wizard.prompt();

        ingress = {
            targetPort: wizardContext.targetPort,
            external: wizardContext.enableIngress,
            transport: 'auto',
            allowInsecure: false,
            traffic: [
                {
                    "weight": 100,
                    "latestRevision": true
                }
            ],
        };
    }

    const containerAppEnvelope = await node.parent.getContainerEnvelopeWithSecrets(context);
    containerAppEnvelope.configuration ||= {};
    containerAppEnvelope.configuration.ingress = ingress;

    const client: WebSiteManagementClient = await createWebSiteClient([context, node]);
    const resourceGroupName = node.parent.resourceGroupName;
    const name = node.parent.name;

    const working = node instanceof IngressTreeItem ? localize('disabling', 'Disabling ingress for container app "{0}"', name) : localize('enabling', 'Enabling ingress for container app "{0}"', name);
    const workSucceeded = node instanceof IngressTreeItem ? localize('disableCompleted', 'Disabled ingress for container app "{0}"', name) : localize('enableCompleted', 'Enabled ingress for container app "{0}"', name);

    // enabling doesn't seem to work, getting internal server errors
    await window.withProgress({ location: ProgressLocation.Notification, title: working }, async (): Promise<void> => {
        ext.outputChannel.appendLog(working);
        await client.containerApps.beginCreateOrUpdateAndWait(resourceGroupName, name, containerAppEnvelope);

        void window.showInformationMessage(workSucceeded);
        ext.outputChannel.appendLog(workSucceeded);
    });

    node instanceof IngressTreeItem ? await node.parent.refresh(context) : await node.refresh(context);
}
