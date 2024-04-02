/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type IActionContext } from "@microsoft/vscode-azext-utils";
import { type AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { type ContainerAppModel } from "../../../tree/ContainerAppItem";
import { getContainerAppSourceControl } from "./getContainerAppSourceControl";

export async function isGitHubConnected(context: IActionContext & { subscription: AzureSubscription, containerApp: ContainerAppModel }): Promise<boolean> {
    return !!await getContainerAppSourceControl(context, context.subscription, context.containerApp);
}
