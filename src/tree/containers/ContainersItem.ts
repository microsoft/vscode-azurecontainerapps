/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { TreeElementBase, nonNullValue } from "@microsoft/vscode-azext-utils";
import { AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { TreeItem, TreeItemCollapsibleState } from "vscode";
import { localize } from "../../utils/localize";
import { treeUtils } from "../../utils/treeUtils";
import { ContainerAppModel } from "../ContainerAppItem";
import type { ContainerAppsItem } from "../ContainerAppsBranchDataProvider";
import { createContainerItem } from "./ContainerItem";

export class ContainersItem implements ContainerAppsItem {
    id: string;

    constructor(public readonly subscription: AzureSubscription, public readonly containerApp: ContainerAppModel) {
        this.id = `${containerApp.id}/containers`;
    }

    getChildren(): TreeElementBase[] {
        const containers = this.containerApp.template?.containers;
        return nonNullValue(containers?.map(container => createContainerItem(container, this.subscription, this.containerApp)));
    }

    getTreeItem(): TreeItem {
        return {
            id: this.id,
            label: localize('containers', 'Containers'),
            iconPath: treeUtils.getIconPath('scaling'), // just a placeholder until we find the containers icon
            collapsibleState: TreeItemCollapsibleState.Collapsed
        }
    }
}
