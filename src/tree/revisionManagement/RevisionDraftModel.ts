/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { Revision } from "@azure/arm-appcontainers";
import { TreeElementBase } from "@microsoft/vscode-azext-utils";
import { AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { TreeItem } from "vscode";
import { ContainerAppModel } from "../ContainerAppItem";
import { RevisionsItemModel } from "./RevisionItem";

export abstract class RevisionDraftModel implements RevisionsItemModel {
    constructor(readonly subscription: AzureSubscription, readonly containerApp: ContainerAppModel, readonly revision: Revision) {
        // Have to call a separate method here because abstract methods cannot be called directly within the constructor
        this.initItemModel();
    }

    private initItemModel(): void {
        this.hasUnsavedChanges() ? this.setPropertiesDraft() : this.setProperties();
    }

    abstract getTreeItem(): Promise<TreeItem>;
    abstract getChildren(): Promise<TreeElementBase[]>;

    abstract hasUnsavedChanges: () => boolean | Promise<boolean>;
    abstract setProperties(): void;
    abstract setPropertiesDraft(): void;
}
