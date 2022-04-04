/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ScaleRule } from "@azure/arm-app";
import { AzExtParentTreeItem, AzExtTreeItem, TreeItemIconPath } from "@microsoft/vscode-azext-utils";
import { ThemeIcon } from "vscode";
import { localize } from "../utils/localize";
import { IAzureResourceTreeItem } from "./IAzureResourceTreeItem";
import { ScaleRuleTreeItem } from "./ScaleRuleTreeItem";
import { ScaleTreeItem } from "./ScaleTreeItem";

export class ScaleRuleGroupTreeItem extends AzExtParentTreeItem implements IAzureResourceTreeItem {
    public static contextValue: string = 'scaleRules|azResource';
    public readonly contextValue: string = ScaleRuleGroupTreeItem.contextValue;
    public readonly parent: ScaleTreeItem;

    public label: string;
    public data: ScaleRule[];

    constructor(parent: ScaleTreeItem, data: ScaleRule[]) {
        super(parent);
        this.label = localize('scaleRules', 'Scale Rules');
        this.data = data;
    }

    public get iconPath(): TreeItemIconPath {
        return new ThemeIcon('symbol-constant');
    }

    public async loadMoreChildrenImpl(): Promise<AzExtTreeItem[]> {
        return this.createTreeItemsWithErrorHandling(
            this.data,
            'invalidRule',
            rule => new ScaleRuleTreeItem(this, rule),
            _rule => localize('invalidScalingRule', 'Invalid Scaling Rule')
        );

    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }
}
