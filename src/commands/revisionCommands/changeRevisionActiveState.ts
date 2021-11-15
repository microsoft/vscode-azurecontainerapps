/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { WebSiteManagementClient } from "@azure/arm-appservice";
import { IActionContext } from "vscode-azureextensionui";
import { ext } from "../../extensionVariables";
import { RevisionTreeItem } from "../../tree/RevisionTreeItem";
import { createWebSiteClient } from "../../utils/azureClients";
import { localize } from "../../utils/localize";
import { nonNullValue } from "../../utils/nonNull";

export async function changeRevisionActiveState(context: IActionContext, command: 'activate' | 'deactivate' | 'restart', node?: RevisionTreeItem): Promise<void> {

    if (!node) {
        node = await ext.tree.showTreeItemPicker<RevisionTreeItem>(RevisionTreeItem.contextValue, context);
    }

    const webClient: WebSiteManagementClient = await createWebSiteClient([context, node]);

    const temporaryDescriptions = {
        'activate': localize('activating', 'Activating...'),
        'deactivate': localize('deactivating', 'Deactivating...'),
        'restart': localize('restarting', 'Restarting...'),
    }
    await node.runWithTemporaryDescription(context, temporaryDescriptions[command], async () => {
        node = nonNullValue(node);
        switch (command) {
            case 'activate':
                await webClient.containerAppsRevisions.activateRevision(node.parent.parent.resourceGroupName, node.parent.parent.name, node.name);
                break;
            case 'deactivate':
                await webClient.containerAppsRevisions.deactivateRevision(node.parent.parent.resourceGroupName, node.parent.parent.name, node.name);
                break;
            case 'restart':
                await webClient.containerAppsRevisions.restartRevision(node.parent.parent.resourceGroupName, node.parent.parent.name, node.name);
                break;
        }
    });

    await node.refresh(context);
}




