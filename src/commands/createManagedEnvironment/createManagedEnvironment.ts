/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { SubscriptionTreeItemBase } from "@microsoft/vscode-azext-azureutils";
import { IActionContext } from "@microsoft/vscode-azext-utils";
import { ext } from "../../extensionVariables";
import { ManagedEnvironmentTreeItem } from "../../tree/ManagedEnvironmentTreeItem";
import { SubscriptionTreeItem } from "../../tree/SubscriptionTreeItem";
import { IManagedEnvironmentContext } from "./IManagedEnvironmentContext";

export async function createManagedEnvironment(context: IActionContext, node?: SubscriptionTreeItemBase): Promise<ManagedEnvironmentTreeItem> {
    node = await ext.rgApi.appResourceTree.showTreeItemPicker<SubscriptionTreeItemBase>(SubscriptionTreeItemBase.contextValue, context);
    const keNode = await SubscriptionTreeItem.createChild(context as IManagedEnvironmentContext, node);
    await ext.rgApi.appResourceTree.refresh(context);
    return keNode;
}
