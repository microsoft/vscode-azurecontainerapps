/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type Revision } from "@azure/arm-appcontainers";
import { type TreeElementBase } from "@microsoft/vscode-azext-utils";
import { type AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { type TreeItem } from "vscode";
import { revisionDraftIdSuffix } from "../../constants";
import { type ContainerAppModel } from "../ContainerAppItem";
import { getParentResource } from "../../utils/revisionDraftUtils";
import { type RevisionsDraftModel } from "./RevisionDraftItem";
import { type RevisionsItemModel } from "./RevisionItem";

/**
 * Can be implemented by any tree item that has the potential to show up as a RevisionDraftItem's descendant
 */
export abstract class RevisionDraftDescendantBase implements RevisionsItemModel, RevisionsDraftModel {
    /**
     * Set to `true` by `createDraftTreeItem` to mark this item as a descendant of RevisionDraftItem.
     * Drives ID generation and `hasUnsavedChanges` gating so that only draft subtree items
     * show draft state and carry unique draft-prefixed IDs.
     */
    isDraftDescendant: boolean = false;

    constructor(readonly subscription: AzureSubscription, readonly containerApp: ContainerAppModel, readonly revision: Revision) { }

    /**
     * The effective parent resource used to read template data.
     * In multiple revisions mode this is the revision; in single mode it is the container app.
     */
    protected get parentResource(): ReturnType<typeof getParentResource> {
        return getParentResource(this.containerApp, this.revision);
    }

    /**
     * Builds a stable, unique tree-item ID for this descendant.
     * When `isDraftDescendant` is `true` the ID is rooted under the draft item path
     * (`{containerAppId}/revisionDraft/{suffix}`) so it never collides with the
     * corresponding node under the base RevisionItem.
     */
    protected buildId(suffix: string): string {
        const prefix = this.isDraftDescendant
            ? `${this.containerApp.id}/${revisionDraftIdSuffix}`
            : this.parentResource.id;
        return `${prefix}/${suffix}`;
    }

    private init(): void {
        if (this.hasUnsavedChanges()) {
            this.setDraftProperties();
        } else {
            this.setProperties();
        }
    }

    // Build the tree items inside a local static method first so that extra '...args' are scoped when we init `setDraftProperties` and `setProperties`
    static createTreeItem<T extends RevisionDraftDescendantBase>(RevisionDraftDescendant: DescendantConstructor<T>, subscription: AzureSubscription, containerApp: ContainerAppModel, revision: Revision, ...args: unknown[]): T {
        const descendant: T = new RevisionDraftDescendant(subscription, containerApp, revision, ...args);
        descendant.init();
        return descendant;
    }

    /**
     * Like `createTreeItem` but marks the item as a draft descendant before initialising it.
     * Use this when creating children of a RevisionDraftItem so they receive draft-prefixed IDs
     * and correctly reflect the draft template state.
     */
    static createDraftTreeItem<T extends RevisionDraftDescendantBase>(RevisionDraftDescendant: DescendantConstructor<T>, subscription: AzureSubscription, containerApp: ContainerAppModel, revision: Revision, ...args: unknown[]): T {
        const descendant: T = new RevisionDraftDescendant(subscription, containerApp, revision, ...args);
        descendant.isDraftDescendant = true;
        descendant.init();
        return descendant;
    }

    /**
     * Creates a child tree item, automatically propagating `isDraftDescendant` so the entire
     * draft subtree carries consistent IDs and draft-state rendering.
     */
    protected createChildItem<T extends RevisionDraftDescendantBase>(ChildClass: DescendantConstructor<T>, ...args: unknown[]): T {
        return this.isDraftDescendant
            ? RevisionDraftDescendantBase.createDraftTreeItem(ChildClass, this.subscription, this.containerApp, this.revision, ...args)
            : RevisionDraftDescendantBase.createTreeItem(ChildClass, this.subscription, this.containerApp, this.revision, ...args);
    }

    abstract getTreeItem(): TreeItem | Promise<TreeItem>;
    getChildren?(): TreeElementBase[] | Promise<TreeElementBase[]>;

    /**
     * Used to determine if the tree item is in a draft state
     */
    abstract hasUnsavedChanges(): boolean;

    /**
     * Properties to display when the tree item has no unsaved changes
     */
    protected abstract setProperties(): void;

    /**
     * Properties to display when the tree item has unsaved changes
     */
    protected abstract setDraftProperties(): void;
}

type DescendantConstructor<T extends RevisionDraftDescendantBase> = new (subscription: AzureSubscription, containerApp: ContainerAppModel, revision: Revision, ...args: unknown[]) => T;
