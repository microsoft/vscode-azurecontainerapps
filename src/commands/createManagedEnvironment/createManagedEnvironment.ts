/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { SubscriptionTreeItemBase } from "@microsoft/vscode-azext-azureutils";
import { AzExtTreeItem, IActionContext } from "@microsoft/vscode-azext-utils";
import { ext } from "../../extensionVariables";
import { SubscriptionTreeItem } from "../../tree/SubscriptionTreeItem";
import { IManagedEnvironmentContext } from "./IManagedEnvironmentContext";

export async function createManagedEnvironment(context: IActionContext, _node?: AzExtTreeItem): Promise<void> {
    const subscription: SubscriptionTreeItemBase = await ext.rgApi.appResourceTree.showTreeItemPicker<SubscriptionTreeItemBase>(SubscriptionTreeItemBase.contextValue, context);
    await SubscriptionTreeItem.createChild(context as IManagedEnvironmentContext, subscription);
    await ext.rgApi.appResourceTree.refresh(context);
}
