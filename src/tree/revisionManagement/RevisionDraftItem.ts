/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode, Revision } from "@azure/arm-appcontainers";
import { TreeElementBase, nonNullProp } from "@microsoft/vscode-azext-utils";
import type { AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { TreeItem, TreeItemCollapsibleState } from "vscode";
import { ext } from "../../extensionVariables";
import { localize } from "../../utils/localize";
import { treeUtils } from "../../utils/treeUtils";
import type { ContainerAppModel } from "../ContainerAppItem";
import { RevisionItem, type RevisionsItemModel } from "./RevisionItem";

export class RevisionDraftItem implements RevisionsItemModel {
    static readonly idSuffix: string = 'revisionDraft';
    static readonly contextValue: string = 'revisionDraftItem';
    static readonly contextValueRegExp: RegExp = new RegExp(RevisionDraftItem.contextValue);

    id: string;
    revisionsMode: KnownActiveRevisionsMode;

    constructor(readonly subscription: AzureSubscription, readonly containerApp: ContainerAppModel, readonly revision: Revision) {
        this.id = `${this.containerApp.id}/${RevisionDraftItem.idSuffix}`;
        this.revisionsMode = containerApp.revisionsMode;
    }

    private get revisionName(): string {
        return nonNullProp(this.revision, 'name');
    }

    /**
     * @example gets "rev-1" of "my-app--rev-1"
     */
    private get baseRevisionName(): string {
        return this.revisionName.split('--').pop() ?? '';
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
        return RevisionItem.getTemplateChildren(this.subscription, this.containerApp, this.revision);
    }
}
