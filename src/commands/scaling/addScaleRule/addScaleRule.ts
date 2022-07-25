/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IActionContext } from "@microsoft/vscode-azext-utils";
import { ext } from "../../../extensionVariables";
import { ScaleRuleGroupTreeItem } from "../../../tree/ScaleRuleGroupTreeItem";


export async function addScaleRule(context: IActionContext, node?: ScaleRuleGroupTreeItem): Promise<void> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<ScaleRuleGroupTreeItem>(new RegExp(ScaleRuleGroupTreeItem.contextValue), context);
    }
    await node.createChild(context);
    await node.refresh(context);
}
