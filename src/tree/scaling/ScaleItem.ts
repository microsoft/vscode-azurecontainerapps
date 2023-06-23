/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { Revision, Scale } from "@azure/arm-appcontainers";
import { createGenericElement, nonNullValue } from "@microsoft/vscode-azext-utils";
import { AzureSubscription, ViewPropertiesModel } from "@microsoft/vscode-azureresources-api";
import { ThemeIcon, TreeItem, TreeItemCollapsibleState } from "vscode";
import { localize } from "../../utils/localize";
import { treeUtils } from "../../utils/treeUtils";
import { ContainerAppModel } from "../ContainerAppItem";
import { ContainerAppsItem, TreeElementBase } from "../ContainerAppsBranchDataProvider";
import { createScaleRuleGroupItem } from "./ScaleRuleGroupItem";

export const minMaxReplicaItemContextValue: string = 'minMaxReplicaItem';

export class ScaleItem implements ContainerAppsItem {
    static readonly contextValue: string = 'scaleItem';
    static readonly contextValueRegExp: RegExp = new RegExp(ScaleItem.contextValue);

    constructor(
        public readonly subscription: AzureSubscription,
        public readonly containerApp: ContainerAppModel,
        public readonly revision: Revision,
    ) { }

    id: string = `${this.parentResource.id}/scale`;

    viewProperties: ViewPropertiesModel = {
        data: this.scale,
        label: `${this.parentResource.name} Scaling`,
    };

    get scale(): Scale {
        return nonNullValue(this.revision?.template?.scale);
    }

    get parentResource(): ContainerAppModel | Revision {
        return this.revision?.name === this.containerApp.latestRevisionName ? this.containerApp : this.revision;
    }

    getTreeItem(): TreeItem {
        return {
            id: this.id,
            label: localize('scaling', 'Scaling'),
            contextValue: ScaleItem.contextValue,
            iconPath: treeUtils.getIconPath('02887-icon-menu-Container-Scale'),
            collapsibleState: TreeItemCollapsibleState.Collapsed,
        }
    }

    async getChildren?(): Promise<TreeElementBase[]> {
        return [
            createGenericElement({
                label: localize('minMax', 'Min / max replicas'),
                description: `${this.scale?.minReplicas ?? 0} / ${this.scale?.maxReplicas ?? 0}`,
                contextValue: minMaxReplicaItemContextValue,
                iconPath: new ThemeIcon('dash'),
            }),
            createScaleRuleGroupItem(this.subscription, this.containerApp, this.revision),
        ]
    }
}
