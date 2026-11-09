/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type IActionContext } from "@microsoft/vscode-azext-utils";
import { env, Uri } from "vscode";
import { expressPortalBaseUrl } from "../constants";
import { type ContainerAppItem } from "../tree/ContainerAppItem";
import { pickContainerApp } from "../utils/pickItem/pickContainerApp";

export async function openExpressPortal(context: IActionContext, node?: ContainerAppItem): Promise<void> {
    node ??= await pickContainerApp(context);
    const url = `${expressPortalBaseUrl}/${node.subscription.subscriptionId}/${node.containerApp.resourceGroup}/${node.containerApp.name}/overview`;
    await env.openExternal(Uri.parse(url));
}
