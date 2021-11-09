/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Dapr } from "@azure/arm-appservice";
import { AzExtTreeItem, TreeItemIconPath } from "vscode-azureextensionui";
import { localize } from "../utils/localize";
import { treeUtils } from "../utils/treeUtils";
import { ContainerAppTreeItem } from "./ContainerAppTreeItem";
import { IAzureResourceTreeItem } from "./IAzureResourceTreeItem";

export class DaprTreeItem extends AzExtTreeItem implements IAzureResourceTreeItem {
    public static contextValue: string = 'dapr|azResource';
    public readonly contextValue: string = DaprTreeItem.contextValue;
    public readonly parent: ContainerAppTreeItem;
    public data: Dapr;

    public label: string;

    constructor(parent: ContainerAppTreeItem, data: Dapr | undefined) {
        super(parent);
        this.label = localize('dapr', 'Dapr');
        this.data = data || {};
        this.description = this.parent.data.template?.dapr ? 'Enabled' : 'Disabled';
    }

    public get iconPath(): TreeItemIconPath {
        return treeUtils.getIconPath('dapr_logo');
    }
}
