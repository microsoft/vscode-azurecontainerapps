/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { SubscriptionTreeItemBase } from "@microsoft/vscode-azext-azureutils";
import { IActionContext, ICreateChildImplContext } from "@microsoft/vscode-azext-utils";
import { ext } from "../../extensionVariables";
import { ManagedEnvironmentTreeItem } from "../../tree/ManagedEnvironmentTreeItem";
import { IManagedEnvironmentContext } from "./IManagedEnvironmentContext";

export async function createManagedEnvironment(context: IActionContext & Partial<ICreateChildImplContext> & Partial<IManagedEnvironmentContext>, node?: SubscriptionTreeItemBase): Promise<ManagedEnvironmentTreeItem> {
    if (!node) {
        node = await ext.rgApi.appResourceTree.showTreeItemPicker<SubscriptionTreeItemBase>(SubscriptionTreeItemBase.contextValue, context);
    }

    const keNode: ManagedEnvironmentTreeItem = await node.createChild(context);
    return keNode;
}
