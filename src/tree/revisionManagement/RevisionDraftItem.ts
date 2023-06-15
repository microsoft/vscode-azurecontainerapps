/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode } from "@azure/arm-appcontainers";
import { AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { TreeItem, TreeItemCollapsibleState } from "vscode";
import { localize } from "../../utils/localize";
import { treeUtils } from "../../utils/treeUtils";
import { ContainerAppModel } from "../ContainerAppItem";
import { ContainerAppsItem } from "../ContainerAppsBranchDataProvider";

export class RevisionDraftItem implements ContainerAppsItem {
    static idSuffix: string = 'revisionDraft';
    static contextValue: string = 'revisionDraftItem';
    static contextValueRegExp: RegExp = new RegExp(RevisionDraftItem.contextValue);

    id: string;
    revisionsMode: KnownActiveRevisionsMode;

    constructor(readonly subscription: AzureSubscription, readonly containerApp: ContainerAppModel, readonly revisionName: string) {
        this.id = `${this.containerApp.id}/${RevisionDraftItem.idSuffix}`;
        this.revisionsMode = containerApp.revisionsMode;
    }

    getTreeItem(): TreeItem {
        return {
            id: this.id,
            label: localize('draft', 'Draft'),
            iconPath: treeUtils.getIconPath('02885-icon-menu-Container-Revision-Draft'),
            description: localize(
                'basedOnRevision',
                'Based on "{0}"',
                this.revisionName === this.containerApp.latestRevisionName ? 'Latest' : this.getRevisionBaseName(this.revisionName)
            ),
            contextValue: RevisionDraftItem.contextValue,
            collapsibleState: TreeItemCollapsibleState.Collapsed,
        };
    }

    /**
     * @example Turns "my-app--rev-1" into "rev-1"
     */
    private getRevisionBaseName(revisionName: string): string {
        return revisionName.substring(revisionName.lastIndexOf('--') + 2);
    }
}
