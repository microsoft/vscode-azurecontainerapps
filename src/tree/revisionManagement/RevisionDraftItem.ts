/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode, Revision } from "@azure/arm-appcontainers";
import { TreeElementBase, nonNullProp } from "@microsoft/vscode-azext-utils";
import { AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { TreeItem, TreeItemCollapsibleState } from "vscode";
import { ext } from "../../extensionVariables";
import { localize } from "../../utils/localize";
import { treeUtils } from "../../utils/treeUtils";
import { ContainerAppModel } from "../ContainerAppItem";
import { ScaleItem } from "../scaling/ScaleItem";
import { RevisionsItemModel } from "./RevisionItem";

export class RevisionDraftItem implements RevisionsItemModel {
    static idSuffix: string = 'revisionDraft';
    static contextValue: string = 'revisionDraftItem';
    static contextValueRegExp: RegExp = new RegExp(RevisionDraftItem.contextValue);

    id: string;
    revisionsMode: KnownActiveRevisionsMode;

    constructor(readonly subscription: AzureSubscription, readonly containerApp: ContainerAppModel, readonly revision: Revision) {
        this.id = `${this.containerApp.id}/${RevisionDraftItem.idSuffix}`;
        this.revisionsMode = containerApp.revisionsMode;
    }

    get revisionName(): string {
        return nonNullProp(this.revision, 'name');
    }

    /**
     * @example gets "rev-1" of "my-app--rev-1"
     */
    private get baseRevisionName(): string {
        return this.revisionName.substring(this.revisionName.lastIndexOf('--') + 2);
    }

    static hasDescendant(item: RevisionsItemModel): boolean {
        const revisionDraftBaseName: string | undefined = ext.revisionDraftFileSystem.getRevisionDraftFile(item)?.baseRevisionName;
        return item.revision.name === revisionDraftBaseName;
    }

    getTreeItem(): TreeItem {
        return {
            id: this.id,
            label: localize('draft', 'Draft'),
            iconPath: treeUtils.getIconPath('revision-draft'),
            description: this.containerApp.latestRevisionName === this.revisionName ?
                localize('basedOnLatestRevision', 'Based on "{0}" (Latest)', this.baseRevisionName) :
                localize('basedOnRevision', 'Based on "{0}"', this.baseRevisionName),
            contextValue: RevisionDraftItem.contextValue,
            collapsibleState: TreeItemCollapsibleState.Expanded
        };
    }

    getChildren(): TreeElementBase[] {
        return [
            new ScaleItem(this.subscription, this.containerApp, this.revision)
        ];
    }
}
