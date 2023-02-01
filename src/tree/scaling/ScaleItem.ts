/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { Revision, Scale } from "@azure/arm-appcontainers";
import { nonNullValue } from "@microsoft/vscode-azext-utils";
import { AzureSubscription, ViewPropertiesModel } from "@microsoft/vscode-azureresources-api";
import { ThemeIcon, TreeItem, TreeItemCollapsibleState } from "vscode";
import { createGenericItem } from "../../utils/GenericItem";
import { localize } from "../../utils/localize";
import { treeUtils } from "../../utils/treeUtils";
import { ContainerAppModel } from "../ContainerAppItem";
import { ContainerAppsItem, TreeElementBase } from "../ContainerAppsBranchDataProvider";
import { createScaleRuleGroupItem } from "./ScaleRuleGroupItem";

export class ScaleItem implements ContainerAppsItem {
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
            contextValue: 'scale',
            iconPath: treeUtils.getIconPath('02887-icon-menu-Container-Scale'),
            collapsibleState: TreeItemCollapsibleState.Collapsed,
        }
    }

    async getChildren?(): Promise<TreeElementBase[]> {
        return [
            createGenericItem({
                label: localize('minMax', 'Min / max replicas'),
                description: `${this.scale?.minReplicas ?? 0} / ${this.scale?.maxReplicas ?? 0}`,
                contextValue: 'minMaxReplica',
                iconPath: new ThemeIcon('dash'),
            }),
            createScaleRuleGroupItem(this.subscription, this.containerApp, this.revision),
        ]
    }
}
