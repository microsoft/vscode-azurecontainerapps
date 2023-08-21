/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import type { Revision } from "@azure/arm-appcontainers";
import type { TreeElementBase } from "@microsoft/vscode-azext-utils";
import type { AzureSubscription } from "@microsoft/vscode-azureresources-api";
import type { TreeItem } from "vscode";
import type { ContainerAppModel } from "../ContainerAppItem";
import type { RevisionsDraftModel } from "./RevisionDraftItem";

/**
 * Can be implemented by any tree item that has the potential to show up as a RevisionDraftItem's descendant
 */
export abstract class RevisionDraftDescendantBase implements RevisionsDraftModel {
    constructor(readonly subscription: AzureSubscription, readonly containerApp: ContainerAppModel, readonly revision: Revision) {
        this.initRevisionDraftDescendant();
    }

    private initRevisionDraftDescendant(): void {
        this.hasUnsavedChanges() ? this.setDraftProperties?.() : this.setProperties?.();
    }

    abstract getTreeItem(): TreeItem | Promise<TreeItem>;
    getChildren?(): TreeElementBase[] | Promise<TreeElementBase[]>;

    abstract hasUnsavedChanges(): boolean;

    protected abstract setProperties(): void;
    protected abstract setDraftProperties(): void;
}
