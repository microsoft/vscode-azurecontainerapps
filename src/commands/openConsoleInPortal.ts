/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/


import { IActionContext } from "@microsoft/vscode-azext-utils";
import { commands } from "vscode";
import { ContainerAppItem } from "../tree/ContainerAppItem";
import { createPortalUrl } from "../utils/createPortalUrl";
import { pickContainerApp } from "../utils/pickContainerApp";

export async function openConsoleInPortal(context: IActionContext, node?: ContainerAppItem): Promise<void> {
    node ??= await pickContainerApp(context);
    await commands.executeCommand('azureResourceGroups.openInPortal', {
        portalUrl: createPortalUrl(node.subscription, `${node.containerApp.id}/console`),
    });
}
