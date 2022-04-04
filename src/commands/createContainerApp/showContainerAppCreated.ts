/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { callWithTelemetryAndErrorHandling, IActionContext } from "@microsoft/vscode-azext-utils";
import { MessageItem, window } from "vscode";
import { ext } from "../../extensionVariables";
import { ContainerAppTreeItem } from "../../tree/ContainerAppTreeItem";
import { localize } from "../../utils/localize";

export async function showContainerAppCreated(node: ContainerAppTreeItem, isUpdate: boolean = false): Promise<void> {
    return await callWithTelemetryAndErrorHandling('containerApps.showCaCreated', async (context: IActionContext) => {
        const createdCa: string = localize('createdCa', 'Successfully created new container app "{0}".', node.name);
        const createdRevision = localize('createdRevision', 'Created a new revision "{1}" for container app "{0}"', node.name, node.data.latestRevisionName);
        const message = isUpdate ? createdRevision : createdCa;
        ext.outputChannel.appendLog(message);

        const browse: MessageItem = { title: localize('browse', 'Browse') };
        const buttons: MessageItem[] = [];
        if (node.ingressEnabled()) { buttons.push(browse) }
        await window.showInformationMessage(message, ...buttons).then(async (result) => {
            context.telemetry.properties.clicked = 'canceled';
            if (result === browse) {
                await node.browse();
                context.telemetry.properties.clicked = 'browse';
            }
        });
    });
}
