/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { Container, Revision } from "@azure/arm-appcontainers";
import { TreeElementBase, nonNullValue } from "@microsoft/vscode-azext-utils";
import { AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { TreeItem, TreeItemCollapsibleState } from "vscode";
import { treeUtils } from "../../utils/treeUtils";
import { ContainerAppModel } from "../ContainerAppItem";
import { RevisionsItemModel } from "../revisionManagement/RevisionItem";
import { ContainerItem } from "./ContainerItem";

export class ContainersItem implements RevisionsItemModel {
    id: string;
    label: string;
    private readonly containers: Container[];

    constructor(public readonly subscription: AzureSubscription, public readonly containerApp: ContainerAppModel, public readonly revision: Revision) {
        this.id = `${containerApp.id}/containers`;
        this.label = 'Containers';
        this.containers = nonNullValue(revision.template?.containers);
    }

    getChildren(): TreeElementBase[] {
        return nonNullValue(this.containers?.map(container => new ContainerItem(this.subscription, this.containerApp, this.revision, container)));
    }

    getTreeItem(): TreeItem {
        return {
            id: this.id,
            label: this.label,
            iconPath: treeUtils.getIconPath('containers'),
            collapsibleState: TreeItemCollapsibleState.Collapsed
        }
    }
}
