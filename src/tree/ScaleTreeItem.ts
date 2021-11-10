/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Scale } from "@azure/arm-appservice";
import { ThemeIcon } from "vscode";
import { AzExtParentTreeItem, AzExtTreeItem, GenericTreeItem, TreeItemIconPath } from "vscode-azureextensionui";
import { localize } from "../utils/localize";
import { ContainerAppTreeItem } from "./ContainerAppTreeItem";
import { IAzureResourceTreeItem } from "./IAzureResourceTreeItem";
import { ScaleRuleGroupTreeItem } from "./ScaleRuleGroupTreeItem";

export class ScaleTreeItem extends AzExtParentTreeItem implements IAzureResourceTreeItem {
    public static contextValue: string = 'scale|azResource';
    public readonly contextValue: string = ScaleTreeItem.contextValue;
    public readonly parent: ContainerAppTreeItem;
    public data: Scale;

    public label: string;

    constructor(parent: ContainerAppTreeItem, data: Scale | undefined) {
        super(parent);
        this.label = localize('scale', 'Scaling');
        this.data = data || {};
    }

    public get iconPath(): TreeItemIconPath {
        return new ThemeIcon('extensions');
    }

    public async loadMoreChildrenImpl(): Promise<AzExtTreeItem[]> {
        return [
            new GenericTreeItem(this, { label: localize('min', 'Min replicas'), description: String(this.data.minReplicas ?? 0), contextValue: 'minReplica' }),
            new GenericTreeItem(this, { label: localize('max', 'Max replicas'), description: String(this.data.maxReplicas ?? 0), contextValue: 'maxReplica' }),
            new ScaleRuleGroupTreeItem(this, this.data.rules ?? [])]
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }
}
