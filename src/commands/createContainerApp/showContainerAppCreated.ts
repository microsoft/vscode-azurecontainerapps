/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerApp } from "@azure/arm-appcontainers";
import { callWithTelemetryAndErrorHandling, IActionContext } from "@microsoft/vscode-azext-utils";
import { MessageItem, window } from "vscode";
import { ext } from "../../extensionVariables";
import { isIngressEnabled } from "../../tree/ContainerAppItem";
import { localize } from "../../utils/localize";
import { browseContainerApp } from "../browseContainerApp";

export async function showContainerAppCreated(containerApp: ContainerApp, isUpdate: boolean = false): Promise<void> {
    return await callWithTelemetryAndErrorHandling('containerApps.showCaCreated', async (context: IActionContext) => {
        const createdCa: string = localize('createdCa', 'Successfully created new container app "{0}".', containerApp.name);
        const createdRevision = localize('createdRevision', 'Created a new revision "{1}" for container app "{0}"', containerApp.name, containerApp.latestRevisionName);
        const message = isUpdate ? createdRevision : createdCa;
        ext.outputChannel.appendLog(message);

        const browse: MessageItem = { title: localize('browse', 'Browse') };
        const buttons: MessageItem[] = [];
        if (isIngressEnabled(containerApp)) {
            buttons.push(browse)
        }
        const result = await window.showInformationMessage(message, ...buttons)

        context.telemetry.properties.clicked = 'canceled';
        if (result === browse) {
            await browseContainerApp(containerApp);
            context.telemetry.properties.clicked = 'browse';
        }
    });
}
