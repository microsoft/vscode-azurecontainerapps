/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { Container, KnownActiveRevisionsMode, Revision } from "@azure/arm-appcontainers";
import { AzureSubscription } from "@microsoft/vscode-azureresources-api";
import * as deepEqual from "deep-eql";
import { TreeItem } from "vscode";
import { ContainerAppModel } from "../ContainerAppItem";
import { RevisionDraftItem, RevisionsDraftModel } from "../revisionManagement/RevisionDraftItem";
import { RevisionsItemModel } from "../revisionManagement/RevisionItem";

export class ImagesItem implements RevisionsItemModel, RevisionsDraftModel {
    static readonly contextValue: string = 'imageItem';
    static readonly contextValueRegExp: RegExp = new RegExp(ImagesItem.contextValue);

    constructor(
        readonly subscription: AzureSubscription,
        readonly containerApp: ContainerAppModel,
        readonly revision: Revision,
        readonly isDraft: boolean,
        readonly containerId: string,
        readonly container: Container) { }
    id: string = `${this.containerId}/image`

    /*private get parentResource(): ContainerAppModel | Revision {
        return this.containerApp.revisionsMode === KnownActiveRevisionsMode.Single ? this.containerApp : this.revision;
    }
    */

    getTreeItem(): TreeItem {
        return {
            id: this.id,
            contextValue: 'containerItemImage',
            description: `${this.container.image}`,
        }
    }

    hasUnsavedChanges(): boolean {
        if (this.containerApp.revisionsMode === KnownActiveRevisionsMode.Multiple && !RevisionDraftItem.hasDescendant(this)) {
            return false;
        }

        if (!this.isDraft) {
            return false;
        }

        const currentImage: string = this.id //not sure about this may have to go ingot the list of containers and find the current image

        return !currentImage || !deepEqual(this.container.image, currentImage)
    }
}
