/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode, type Container, type Revision, type Template } from "@azure/arm-appcontainers";
import { type TreeElementBase } from "@microsoft/vscode-azext-utils";
import { type AzureSubscription, type ViewPropertiesModel } from "@microsoft/vscode-azureresources-api";
import * as deepEqual from "deep-eql";
import { TreeItemCollapsibleState, type TreeItem } from "vscode";
import { ext } from "../../extensionVariables";
import { getParentResource, getParentResourceFromCache } from "../../utils/revisionDraftUtils";
import { type ContainerAppModel } from "../ContainerAppItem";
import { RevisionDraftDescendantBase } from "../revisionManagement/RevisionDraftDescendantBase";
import { RevisionDraftItem } from "../revisionManagement/RevisionDraftItem";
import { containerTitle } from "./ContainersItem";
import { EnvironmentVariablesItem } from "./EnvironmentVariablesItem";
import { ImageItem } from "./ImageItem";

export class ContainerItem extends RevisionDraftDescendantBase {
    id: string;
    label: string;

    static readonly contextValue: string = 'containerItem';
    static readonly contextValueRegExp: RegExp = new RegExp(ContainerItem.contextValue);

    constructor(
        subscription: AzureSubscription,
        containerApp: ContainerAppModel,
        revision: Revision,
        readonly containersIdx: number,

        // Used as the basis for the view; can reflect either the original or the draft changes
        readonly container: Container,
    ) {
        super(subscription, containerApp, revision);
        this.id = `${this.parentResource.id}/${container.name}`;
    }

    getTreeItem(): TreeItem {
        return {
            id: this.id,
            label: this.label,
            contextValue: ContainerItem.contextValue,
            collapsibleState: TreeItemCollapsibleState.Collapsed,
        }
    }

    getChildren(): TreeElementBase[] {
        return [
            RevisionDraftDescendantBase.createTreeItem(ImageItem, this.subscription, this.containerApp, this.revision, this.containersIdx, this.container),
            RevisionDraftDescendantBase.createTreeItem(EnvironmentVariablesItem, this.subscription, this.containerApp, this.revision, this.containersIdx, this.container),
        ];
    }

    private get parentResource(): ContainerAppModel | Revision {
        return getParentResource(this.containerApp, this.revision);
    }

    viewProperties: ViewPropertiesModel = {
        label: containerTitle,
        getData: () => {
            let cachedResource: Template | undefined;
            if (ext.revisionDraftFileSystem.doesContainerAppsItemHaveRevisionDraft(this)) {
                cachedResource = ext.revisionDraftFileSystem.parseRevisionDraft(this);
            } else {
                cachedResource = getParentResourceFromCache(this.containerApp, this.revision)?.template;
            }

            const parentResource: Template | undefined = cachedResource ?? this.parentResource.template;
            return Promise.resolve(
                parentResource?.containers?.[this.containersIdx] ?? []
            );
        }
    }

    protected setProperties(): void {
        this.label = this.container.name ?? '';
    }

    protected setDraftProperties(): void {
        this.label = `${this.container.name}*`;
    }

    hasUnsavedChanges(): boolean {
        // We only care about showing changes to descendants of the revision draft item when in multiple revisions mode
        if (this.containerApp.revisionsMode === KnownActiveRevisionsMode.Multiple && !RevisionDraftItem.hasDescendant(this)) {
            return false;
        }

        const currentContainers: Container[] = this.parentResource.template?.containers ?? [];
        const currentContainer: Container | undefined = currentContainers[this.containersIdx];

        return !currentContainer || !deepEqual(this.container, currentContainer);
    }
}

