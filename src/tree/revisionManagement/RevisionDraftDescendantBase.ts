/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type Revision } from "@azure/arm-appcontainers";
import { type TreeElementBase } from "@microsoft/vscode-azext-utils";
import { type AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { type TreeItem } from "vscode";
import { type ContainerAppModel } from "../ContainerAppItem";
import { type RevisionsDraftModel } from "./RevisionDraftItem";
import { type RevisionsItemModel } from "./RevisionItem";

/**
 * Can be implemented by any tree item that has the potential to show up as a RevisionDraftItem's descendant
 */
export abstract class RevisionDraftDescendantBase implements RevisionsItemModel, RevisionsDraftModel {
    constructor(readonly subscription: AzureSubscription, readonly containerApp: ContainerAppModel, readonly revision: Revision) { }

    private init(): void {
        this.hasUnsavedChanges() ? this.setDraftProperties() : this.setProperties();
    }

    // Build the tree items inside a local static method first so that extra '...args' are scoped when we init `setDraftProperties` and `setProperties`
    static createTreeItem<T extends RevisionDraftDescendantBase>(RevisionDraftDescendant: DescendantConstructor<T>, subscription: AzureSubscription, containerApp: ContainerAppModel, revision: Revision, ...args: unknown[]): T {
        const descendant: T = new RevisionDraftDescendant(subscription, containerApp, revision, ...args);
        descendant.init();
        return descendant;
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

type DescendantConstructor<T extends RevisionDraftDescendantBase> = new(subscription: AzureSubscription, containerApp: ContainerAppModel, revision: Revision, ...args: unknown[]) => T;
