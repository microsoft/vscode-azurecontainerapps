/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type Container, type Revision } from "@azure/arm-appcontainers";
import { createGenericElement, nonNullProp, nonNullValue, type TreeElementBase } from "@microsoft/vscode-azext-utils";
import { type AzureSubscription, type ViewPropertiesModel } from "@microsoft/vscode-azureresources-api";
import { ThemeIcon, TreeItemCollapsibleState, type TreeItem } from "vscode";
import { localize } from "../../utils/localize";
import { getParentResource } from "../../utils/revisionDraftUtils";
import { type ContainerAppModel } from "../ContainerAppItem";
import { type RevisionsItemModel } from "../revisionManagement/RevisionItem";

export class ImageItem implements RevisionsItemModel {
    static readonly contextValue: string = 'imageItem';
    static readonly contextValueRegExp: RegExp = new RegExp(ImageItem.contextValue);

    constructor(
        readonly subscription: AzureSubscription,
        readonly containerApp: ContainerAppModel,
        readonly revision: Revision,
        readonly containerId: string,
        readonly container: Container) { }
    id: string = `${this.parentResource.id}/image`

    getTreeItem(): TreeItem {
        return {
            id: this.id,
            label: localize('image', 'Image'),
            iconPath: new ThemeIcon('window'),
            contextValue: ImageItem.contextValue,
            collapsibleState: TreeItemCollapsibleState.Collapsed,
        }
    }

    getChildren(): TreeElementBase[] {
        const loginServer = this.container.image?.split('/')[0];
        const imageAndTag = this.container.image?.substring(nonNullValue(loginServer?.length) + 1, this.container.image?.length);
        return [
            createGenericElement({
                id: `${this.id}/imageName`,
                label: localize('containerImage', 'Name:'),
                contextValue: 'containerImageNameItem',
                description: `${imageAndTag}`,
            }),
            createGenericElement({
                id: `${this.id}/imageRegistry`,
                label: localize('containerImageRegistryItem', 'Registry:'),
                contextValue: 'containerImageRegistryItem',
                description: `${loginServer}`,
            })
        ];
    }

    private get parentResource(): ContainerAppModel | Revision {
        return getParentResource(this.containerApp, this.revision);
    }

    viewProperties: ViewPropertiesModel = {
        data: this.container,
        label: nonNullProp(this.container, 'name'),
    }
}
