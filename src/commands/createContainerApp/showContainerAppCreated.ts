/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { MessageItem, window } from "vscode";
import { callWithTelemetryAndErrorHandling, IActionContext } from "vscode-azureextensionui";
import { ext } from "../../extensionVariables";
import { ContainerAppTreeItem } from "../../tree/ContainerAppTreeItem";
import { localize } from "../../utils/localize";

export async function showContainerAppCreated(caNode: ContainerAppTreeItem): Promise<void> {
    return await callWithTelemetryAndErrorHandling('containerApps.showCaCreated', async (context: IActionContext) => {
        const createdCa: string = localize('createdCa', 'Successfully created new container app "{0}".', caNode.name);
        ext.outputChannel.appendLog(createdCa);

        const browse: MessageItem = { title: localize('browse', 'Browse') };
        await window.showInformationMessage(createdCa, browse).then(async (result) => {
            context.telemetry.properties.clicked = 'canceled';
            if (result === browse) {
                await caNode.browse();
                context.telemetry.properties.clicked = 'browse';
            }
        });
    });
}
