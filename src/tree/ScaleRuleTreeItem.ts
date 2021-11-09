/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ScaleRule } from "@azure/arm-appservice";
import { ThemeIcon } from "vscode";
import { AzExtTreeItem, TreeItemIconPath } from "vscode-azureextensionui";
import { localize } from "../utils/localize";
import { nonNullProp } from "../utils/nonNull";
import { IAzureResourceTreeItem } from "./IAzureResourceTreeItem";
import { ScaleRuleGroupTreeItem } from "./ScaleRuleGroupTreeItem";

export class ScaleRuleTreeItem extends AzExtTreeItem implements IAzureResourceTreeItem {
    public static contextValue: string = 'scaleRule|azResource';
    public readonly contextValue: string = ScaleRuleTreeItem.contextValue;
    public readonly parent: ScaleRuleGroupTreeItem;
    public data: ScaleRule;

    public label: string;

    constructor(parent: ScaleRuleGroupTreeItem, data: ScaleRule) {
        super(parent);
        this.data = data;
        this.label = nonNullProp(data, 'name');
    }

    public get description(): string {
        if (this.data.http) return localize('http', "HTTP");
        else if (this.data.azureQueue) return localize('azureQueue', 'Azure Queue');
        else if (this.data.custom) return localize('custom', 'Custom');
        else return localize('unknown', 'Unknown');
    }

    public get iconPath(): TreeItemIconPath {
        return new ThemeIcon('symbol-constant');
    }
}
