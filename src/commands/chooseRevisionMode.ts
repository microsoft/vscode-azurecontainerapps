/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerAppsAPIClient } from "@azure/arm-app";
import { ProgressLocation, window } from "vscode";
import { IActionContext, IAzureQuickPickItem } from "vscode-azureextensionui";
import { RevisionConstants } from "../constants";
import { ext } from "../extensionVariables";
import { RevisionsTreeItem } from "../tree/RevisionsTreeItem";
import { createContainerAppsAPIClient } from "../utils/azureClients";
import { localize } from "../utils/localize";
import { nonNullValue } from "../utils/nonNull";

export async function chooseRevisionMode(context: IActionContext, node?: RevisionsTreeItem): Promise<void> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<RevisionsTreeItem>(RevisionsTreeItem.contextValue, context);
    }

    const picks: IAzureQuickPickItem<string>[] = [{ label: RevisionConstants.single, description: localize('singleDesc', 'One active revision at a time'), data: 'single' },
    { label: RevisionConstants.multiple, description: localize('multipleDesc', 'Several revisions active simultaneously'), data: 'multiple' }];
    const placeHolder = localize('chooseRevision', 'Choose revision mode');

    const currentModeQp = picks.find(mode => mode.data === node?.parent.data.configuration?.activeRevisionsMode?.toLowerCase());
    currentModeQp ? currentModeQp.description += localize('current', ' (current)') : undefined;

    const result = await context.ui.showQuickPick(picks, { placeHolder, suppressPersistence: true });

    if (currentModeQp !== result) {
        // only update it if it's actually different
        const appClient: ContainerAppsAPIClient = await createContainerAppsAPIClient([context, node]);
        const containerAppEnvelope = await node.parent.getContainerEnvelopeWithSecrets(context);
        const updating = localize('updatingRevision', 'Updating revision mode of "{0}" to "{1}"...', node.parent.name, result.label.toLowerCase());
        const updated = localize('updatedRevision', 'Updated revision mode of "{0}" to "{1}".', node.parent.name, result.label.toLowerCase());

        containerAppEnvelope.configuration.activeRevisionsMode = result.data;

        containerAppEnvelope.configuration.ingress ||= {};
        containerAppEnvelope.configuration.ingress.traffic = result.data === 'single' ? undefined : containerAppEnvelope.configuration.ingress.traffic;

        await window.withProgress({ location: ProgressLocation.Notification, title: updating }, async (): Promise<void> => {
            const pNode = nonNullValue(node).parent;
            ext.outputChannel.appendLog(updating);
            await appClient.containerApps.beginCreateOrUpdateAndWait(pNode.resourceGroupName, pNode.name, containerAppEnvelope);

            void window.showInformationMessage(updated);
            ext.outputChannel.appendLog(updated);
        });
    }

    await node.parent.refresh(context);
}
