/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode, type Container, type Revision } from "@azure/arm-appcontainers";
import { TreeElementBase, nonNullValue } from "@microsoft/vscode-azext-utils";
import { AzureSubscription } from "@microsoft/vscode-azureresources-api";
import * as deepEqual from "deep-eql";
import { TreeItem, TreeItemCollapsibleState } from "vscode";
import { ext } from "../../extensionVariables";
import { treeUtils } from "../../utils/treeUtils";
import { ContainerAppModel } from "../ContainerAppItem";
import { RevisionDraftItem, RevisionsDraftModel } from "../revisionManagement/RevisionDraftItem";
import { RevisionsItemModel } from "../revisionManagement/RevisionItem";
import { ImagesItem } from "./ImagesItem";

export class ContainerItem implements RevisionsItemModel, RevisionsDraftModel {
    id: string;
    label: string;
    static readonly contextValue: string = 'containerItem';
    static readonly contextValueRegExp: RegExp = new RegExp(ContainerItem.contextValue);

    constructor(readonly subscription: AzureSubscription, readonly containerApp: ContainerAppModel, readonly revision: Revision, readonly container: Container) {
        this.id = `containerItem-${this.container.name}-${this.revision.name}`;

        if (this.hasUnsavedChanges()) {
            this.label = `${this.container.name}*`;
        } else {
            this.label = nonNullValue(this.container.name);
        }
    }

    private get parentResource(): ContainerAppModel | Revision {
        return this.containerApp.revisionsMode === KnownActiveRevisionsMode.Single ? this.containerApp : this.revision;
    }

    getTreeItem(): TreeItem {
        return {
            id: this.id,
            label: this.container.name,
            iconPath: treeUtils.getIconPath('scaling'), // just a placeholder until we find the containers icon
            contextValue: 'containerItem',
            collapsibleState: TreeItemCollapsibleState.Collapsed,
        }
    }

    getChildren(): TreeElementBase[] {
        return [new ImagesItem(this.subscription, this.containerApp, this.revision, this.hasUnsavedChanges(), this.id, this.container)];
    }

    hasUnsavedChanges(): boolean {
        if (this.containerApp.revisionsMode === KnownActiveRevisionsMode.Multiple && !RevisionDraftItem.hasDescendant(this)) {
            return false;
        }

        const draftTemplate: Container[] | undefined = ext.revisionDraftFileSystem.parseRevisionDraft(this)?.containers;
        const currentTemplate: Container[] | undefined = this.parentResource.template?.containers; //not sure about this

        if (!draftTemplate) {
            return false;
        }

        return !deepEqual(currentTemplate, draftTemplate);
    }
}
