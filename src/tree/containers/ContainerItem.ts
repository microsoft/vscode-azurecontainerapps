/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type Container, type Revision } from "@azure/arm-appcontainers";
import { nonNullProp, nonNullValue, type TreeElementBase } from "@microsoft/vscode-azext-utils";
import { type AzureSubscription, type ViewPropertiesModel } from "@microsoft/vscode-azureresources-api";
import { TreeItemCollapsibleState, type TreeItem } from "vscode";
import { type ContainerAppModel } from "../ContainerAppItem";
import { type RevisionsItemModel } from "../revisionManagement/RevisionItem";
import { EnvironmentVariablesItem } from "./EnvironmentVariablesItem";
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
            label: `${this.container.name}`,
            contextValue: 'containerItemName',
            collapsibleState: TreeItemCollapsibleState.Collapsed,
        }
    }

    getChildren(): TreeElementBase[] {
        return [
            new ImagesItem(this.subscription, this.containerApp, this.revision, this.id, this.container),
            new EnvironmentVariablesItem(this.subscription, this.containerApp, this.revision, this.id, this.container)
        ];
    }

    viewProperties: ViewPropertiesModel = {
        data: this.container,
        label: nonNullProp(this.container, 'name'),
    }
}
