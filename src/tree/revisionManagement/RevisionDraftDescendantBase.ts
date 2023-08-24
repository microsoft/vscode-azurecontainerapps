/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import type { Revision } from "@azure/arm-appcontainers";
import type { AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { ProviderResult, TreeItem } from "vscode";
import type { ContainerAppModel } from "../ContainerAppItem";
import { TreeElementBase } from "../ContainerAppsBranchDataProvider";
import type { RevisionsDraftModel } from "./RevisionDraftItem";
import { RevisionsItemModel } from "./RevisionItem";

/**
 * Can be implemented by any tree item that has the potential to show up as a RevisionDraftItem's descendant
 */
export abstract class RevisionDraftDescendantBase implements RevisionsDraftModel, RevisionsItemModel {
    constructor(readonly subscription: AzureSubscription, readonly containerApp: ContainerAppModel, readonly revision: Revision) { }

    abstract getChildren?(): ProviderResult<TreeElementBase[]>;
    abstract getTreeItem(): TreeItem | Thenable<TreeItem>;

    private initRevisionDraftDescendant(): void {
        this.hasUnsavedChanges() ? this.setDraftProperties() : this.setProperties();
    }

    public static create<T extends RevisionDraftDescendantBase>(subscription: AzureSubscription, containerApp: ContainerAppModel, revision: Revision, descendantType: Descendant<T>, ...args: unknown[]) {
        const item = new descendantType(subscription, containerApp, revision, ...args);
        item.initRevisionDraftDescendant();
        return item;
    }

    abstract hasUnsavedChanges(): boolean;

    protected abstract setProperties(): void;
    protected abstract setDraftProperties(): void;
}

type Descendant<T> = new (subscription: AzureSubscription, containerApp: ContainerAppModel, revision: Revision, ...args: unknown[]) => T
