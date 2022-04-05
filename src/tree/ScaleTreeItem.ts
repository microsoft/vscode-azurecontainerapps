/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Scale } from "@azure/arm-app";
import { AzExtParentTreeItem, AzExtTreeItem, GenericTreeItem, TreeItemIconPath } from "@microsoft/vscode-azext-utils";
import { ThemeIcon } from "vscode";
import { azResourceContextValue } from "../constants";
import { localize } from "../utils/localize";
import { treeUtils } from "../utils/treeUtils";
import { ContainerAppTreeItem } from "./ContainerAppTreeItem";
import { IAzureResourceTreeItem } from "./IAzureResourceTreeItem";
import { RevisionTreeItem } from "./RevisionTreeItem";
import { ScaleRuleGroupTreeItem } from "./ScaleRuleGroupTreeItem";

export class ScaleTreeItem extends AzExtParentTreeItem implements IAzureResourceTreeItem {
    public static contextValue: string = 'scale';
    public readonly contextValue: string = `${ScaleTreeItem.contextValue}|${azResourceContextValue}`;
    public readonly parent: ContainerAppTreeItem | RevisionTreeItem;
    public data: Scale;

    public label: string;

    constructor(parent: ContainerAppTreeItem | RevisionTreeItem, data: Scale | undefined) {
        super(parent);
        this.label = localize('scale', 'Scaling');
        this.data = data || {};
    }

    public get iconPath(): TreeItemIconPath {
        return treeUtils.getIconPath('02887-icon-menu-Container-Scale');
    }

    public async loadMoreChildrenImpl(): Promise<AzExtTreeItem[]> {
        return [
            new GenericTreeItem(this, { label: localize('min', 'Min replicas'), description: String(this.data.minReplicas ?? 0), contextValue: 'minReplica', iconPath: new ThemeIcon('dash') }),
            new GenericTreeItem(this, { label: localize('max', 'Max replicas'), description: String(this.data.maxReplicas ?? 0), contextValue: 'maxReplica', iconPath: new ThemeIcon('dash') }),
            new ScaleRuleGroupTreeItem(this, this.data.rules ?? [])]
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }
}
