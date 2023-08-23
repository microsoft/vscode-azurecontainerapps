/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { Container, Revision } from "@azure/arm-appcontainers";
import { AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { TreeItem } from "vscode";
import { ContainerAppModel } from "../ContainerAppItem";
import { RevisionsItemModel } from "../revisionManagement/RevisionItem";

export class ImagesItem implements RevisionsItemModel {
    static readonly contextValue: string = 'imageItem';
    static readonly contextValueRegExp: RegExp = new RegExp(ImagesItem.contextValue);

    constructor(
        readonly subscription: AzureSubscription,
        readonly containerApp: ContainerAppModel,
        readonly revision: Revision,
        readonly containerId: string,
        readonly container: Container) { }
    id: string = `${this.containerId}/image`

    getTreeItem(): TreeItem {
        return {
            id: this.id,
            contextValue: 'containerItemImage',
            description: `${this.container.image}`,
        }
    }
}
