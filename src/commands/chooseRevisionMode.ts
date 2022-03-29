/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerAppsAPIClient } from "@azure/arm-app";
import { ProgressLocation, window } from "vscode";
import { IActionContext, IAzureQuickPickItem } from "vscode-azureextensionui";
import { RevisionConstants } from "../constants";
import { ext } from "../extensionVariables";
import { ContainerAppTreeItem } from "../tree/ContainerAppTreeItem";
import { RevisionsTreeItem } from "../tree/RevisionsTreeItem";
import { createContainerAppsAPIClient } from "../utils/azureClients";
import { localize } from "../utils/localize";
import { nonNullValue } from "../utils/nonNull";

export async function chooseRevisionMode(context: IActionContext, node?: ContainerAppTreeItem): Promise<void> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<ContainerAppTreeItem>(new RegExp(ContainerAppTreeItem.contextValue), context);
    }

    if (node instanceof RevisionsTreeItem) {
        node = node.parent;
    }

    const picks: IAzureQuickPickItem<string>[] = [RevisionConstants.single, RevisionConstants.multiple];
    const placeHolder = localize('chooseRevision', 'Choose revision mode');

    const currentModeQp = picks.find(mode => mode.data === node?.data.configuration?.activeRevisionsMode?.toLowerCase());
    currentModeQp ? currentModeQp.detail = localize('current', ' current') : undefined;

    const result = await context.ui.showQuickPick(picks, { placeHolder, suppressPersistence: true });

    if (currentModeQp !== result) {
        // only update it if it's actually different
        const appClient: ContainerAppsAPIClient = await createContainerAppsAPIClient([context, node]);
        const containerAppEnvelope = await node.getContainerEnvelopeWithSecrets(context);
        const updating = localize('updatingRevision', 'Updating revision mode of "{0}" to "{1}"...', node.name, result.label.toLowerCase());
        const updated = localize('updatedRevision', 'Updated revision mode of "{0}" to "{1}".', node.name, result.label.toLowerCase());

        containerAppEnvelope.configuration.activeRevisionsMode = result.data;

        containerAppEnvelope.configuration.ingress ||= {};
        containerAppEnvelope.configuration.ingress.traffic = result.data === 'single' ? undefined : containerAppEnvelope.configuration.ingress.traffic;

        await window.withProgress({ location: ProgressLocation.Notification, title: updating }, async (): Promise<void> => {
            const pNode = nonNullValue(node);
            ext.outputChannel.appendLog(updating);
            await appClient.containerApps.beginCreateOrUpdateAndWait(pNode.resourceGroupName, pNode.name, containerAppEnvelope);

            void window.showInformationMessage(updated);
            ext.outputChannel.appendLog(updated);
        });
    }

    await node.refresh(context);
}
