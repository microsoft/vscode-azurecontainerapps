/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IActionContext } from "@microsoft/vscode-azext-utils";
import { ext } from "../../../extensionVariables";
import { ContainerAppTreeItem } from "../../../tree/ContainerAppTreeItem";
import { ScaleRuleGroupTreeItem } from "../../../tree/ScaleRuleGroupTreeItem";
import { treeUtils } from "../../../utils/treeUtils";


export async function addScaleRule(context: IActionContext, node?: ScaleRuleGroupTreeItem): Promise<void> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<ScaleRuleGroupTreeItem>(new RegExp(ScaleRuleGroupTreeItem.contextValue), context);
    }
    const containerApp: ContainerAppTreeItem = treeUtils.findNearestParent(node, ContainerAppTreeItem.prototype) as ContainerAppTreeItem;
    await node.createChild(context);
    await containerApp?.refresh(context);
}
