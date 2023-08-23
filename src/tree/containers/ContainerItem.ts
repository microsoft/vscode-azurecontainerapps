/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type Container, type Revision } from "@azure/arm-appcontainers";
import { TreeElementBase, nonNullValue } from "@microsoft/vscode-azext-utils";
import { AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { TreeItem, TreeItemCollapsibleState } from "vscode";
import { treeUtils } from "../../utils/treeUtils";
import { ContainerAppModel } from "../ContainerAppItem";
import { RevisionsItemModel } from "../revisionManagement/RevisionItem";
import { ImagesItem } from "./ImagesItem";

export class ContainerItem implements RevisionsItemModel {
    id: string;
    label: string;
    static readonly contextValue: string = 'containerItem';
    static readonly contextValueRegExp: RegExp = new RegExp(ContainerItem.contextValue);

    constructor(readonly subscription: AzureSubscription, readonly containerApp: ContainerAppModel, readonly revision: Revision, readonly container: Container) {
        this.id = `containerItem-${this.container.name}-${this.revision.name}`;
        this.label = nonNullValue(this.container.name);
    }

    getTreeItem(): TreeItem {
        return {
            id: this.id,
            label: this.container.name,
            iconPath: treeUtils.getIconPath('containers'),
            contextValue: 'containerItem',
            collapsibleState: TreeItemCollapsibleState.Collapsed,
        }
    }

    getChildren(): TreeElementBase[] {
        return [new ImagesItem(this.subscription, this.containerApp, this.revision, this.id, this.container)];
    }
}
