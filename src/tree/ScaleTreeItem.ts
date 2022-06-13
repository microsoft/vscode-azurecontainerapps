/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Container, Scale } from "@azure/arm-appcontainers";
import { AzExtParentTreeItem, AzExtTreeItem, GenericTreeItem, TreeItemIconPath } from "@microsoft/vscode-azext-utils";
import { ThemeIcon } from "vscode";
import { azResourceContextValue } from "../constants";
import { ResolvedContainerAppResource } from "../resolver/ResolvedContainerAppResource";
import { localize } from "../utils/localize";
import { treeUtils } from "../utils/treeUtils";
import { IAzureResourceTreeItem } from "./IAzureResourceTreeItem";
import { RevisionTreeItem } from "./RevisionTreeItem";
import { ScaleRuleGroupTreeItem } from "./ScaleRuleGroupTreeItem";

export class ScaleTreeItem extends AzExtParentTreeItem implements IAzureResourceTreeItem {
    public static contextValue: string = 'scale';
    public readonly contextValue: string = `${ScaleTreeItem.contextValue}|${azResourceContextValue}`;
    public readonly parent: AzExtParentTreeItem & ResolvedContainerAppResource<Container> | RevisionTreeItem;
    public data: Scale;

    public label: string;
    public minReplicas: string;
    public maxReplicas: string;

    constructor(parent: AzExtParentTreeItem, data: Scale | undefined) {
        super(parent);
        this.label = localize('scale', 'Scaling');

        this.data = data || {};
        this.minReplicas = String(this.data.minReplicas ?? 0);
        this.maxReplicas = String(this.data.maxReplicas ?? this.data.minReplicas ?? 0);
    }

    public get iconPath(): TreeItemIconPath {
        return treeUtils.getIconPath('02887-icon-menu-Container-Scale');
    }

    public async loadMoreChildrenImpl(): Promise<AzExtTreeItem[]> {
        return [
            new GenericTreeItem(this, { label: localize('minMax', 'Min / max replicas'), description: `${this.minReplicas} / ${this.maxReplicas}`, contextValue: 'minMaxReplica', iconPath: new ThemeIcon('dash') }),
            new ScaleRuleGroupTreeItem(this, this.data.rules ?? [])]
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }
}
