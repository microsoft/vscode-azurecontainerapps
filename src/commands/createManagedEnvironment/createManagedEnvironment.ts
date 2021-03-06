/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IActionContext, ICreateChildImplContext } from "@microsoft/vscode-azext-utils";
import { ext } from "../../extensionVariables";
import { ManagedEnvironmentTreeItem } from "../../tree/ManagedEnvironmentTreeItem";
import { SubscriptionTreeItem } from "../../tree/SubscriptionTreeItem";
import { IManagedEnvironmentContext } from "./IManagedEnvironmentContext";

export async function createManagedEnvironment(context: IActionContext & Partial<ICreateChildImplContext> & Partial<IManagedEnvironmentContext>, node?: SubscriptionTreeItem): Promise<ManagedEnvironmentTreeItem> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<SubscriptionTreeItem>(SubscriptionTreeItem.contextValue, context);
    }

    const keNode: ManagedEnvironmentTreeItem = await node.createChild(context);
    return keNode;
}
