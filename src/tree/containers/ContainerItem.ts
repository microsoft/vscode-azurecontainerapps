/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type Container, type Revision } from "@azure/arm-appcontainers";
import { nonNullProp, nonNullValue, type TreeElementBase } from "@microsoft/vscode-azext-utils";
import { type AzureSubscription, type ViewPropertiesModel } from "@microsoft/vscode-azureresources-api";
import { TreeItemCollapsibleState, type TreeItem } from "vscode";
import { getParentResource } from "../../utils/revisionDraftUtils";
import { type ContainerAppModel } from "../ContainerAppItem";
import { type RevisionsItemModel } from "../revisionManagement/RevisionItem";
import { EnvironmentVariablesItem } from "./EnvironmentVariablesItem";
import { ImageItem } from "./ImageItem";

export class ContainerItem implements RevisionsItemModel {
    id: string;
    label: string;
    static readonly contextValue: string = 'containerItem';
    static readonly contextValueRegExp: RegExp = new RegExp(ContainerItem.contextValue);

    constructor(readonly subscription: AzureSubscription, readonly containerApp: ContainerAppModel, readonly revision: Revision, readonly container: Container) {
        this.id = `${this.parentResource.id}/${container.name}`;
        this.label = nonNullValue(this.container.name);
    }

    getTreeItem(): TreeItem {
        return {
            id: this.id,
            label: `${this.container.name}`,
            contextValue: ContainerItem.contextValue,
            collapsibleState: TreeItemCollapsibleState.Collapsed,
        }
    }

    getChildren(): TreeElementBase[] {
        return [
            new ImageItem(this.subscription, this.containerApp, this.revision, this.id, this.container),
            new EnvironmentVariablesItem(this.subscription, this.containerApp, this.revision, this.id, this.container)
        ];
    }

    private get parentResource(): ContainerAppModel | Revision {
        return getParentResource(this.containerApp, this.revision);
    }

    // Todo: Update to use 'getData' after PR merges adding containerIdx
    viewProperties: ViewPropertiesModel = {
        data: this.container,
        label: nonNullProp(this.container, 'name'),
    }
}
