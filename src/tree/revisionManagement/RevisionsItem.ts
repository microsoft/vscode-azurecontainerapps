/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { uiUtils } from "@microsoft/vscode-azext-azureutils";
import { callWithTelemetryAndErrorHandling, createContextValue, createSubscriptionContext } from "@microsoft/vscode-azext-utils";
import { AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { TreeItem, TreeItemCollapsibleState } from "vscode";
import { ext } from "../../extensionVariables";
import { createContainerAppsAPIClient } from "../../utils/azureClients";
import { localize } from "../../utils/localize";
import { treeUtils } from "../../utils/treeUtils";
import { ContainerAppModel } from "../ContainerAppItem";
import { ContainerAppsItem, TreeElementBase } from "../ContainerAppsBranchDataProvider";
import { RevisionDraftItem } from "./RevisionDraftItem";
import { RevisionItem } from "./RevisionItem";

export class RevisionsItem implements ContainerAppsItem {
    static idSuffix: string = 'revisions';
    static contextValue: string = 'revisionsItem';
    static contextValueRegExp: RegExp = new RegExp(RevisionsItem.contextValue);

    id: string;

    constructor(readonly subscription: AzureSubscription, readonly containerApp: ContainerAppModel) {
        this.id = `${containerApp.id}/${RevisionsItem.idSuffix}`;
    }

    get contextValue(): string {
        const values: string[] = [RevisionsItem.contextValue];
        values.push(ext.revisionDraftFileSystem.doesContainerAppsItemHaveRevisionDraft(this) ? 'revisionDraft:true' : 'revisionDraft:false');
        return createContextValue(values);
    }

    async getChildren(): Promise<TreeElementBase[]> {
        const result = (await callWithTelemetryAndErrorHandling('getChildren', async (context) => {
            const client = await createContainerAppsAPIClient([context, createSubscriptionContext(this.subscription)]);
            const revisions = await uiUtils.listAllIterator(client.containerAppsRevisions.listRevisions(this.containerApp.resourceGroup, this.containerApp.name));
            return revisions.map(revision => new RevisionItem(this.subscription, this.containerApp, revision));
        }))?.reverse() ?? [];

        const draftBaseRevisionName: string | undefined = ext.revisionDraftFileSystem.getBaseRevisionNameUsingItem(this);
        return draftBaseRevisionName ? [new RevisionDraftItem(this.subscription, this.containerApp, draftBaseRevisionName), ...result] : result;
    }

    getTreeItem(): TreeItem {
        return {
            label: localize('revisions', 'Revision Management'),
            iconPath: treeUtils.getIconPath('02889-icon-menu-Container-Revision-Management'),
            contextValue: this.contextValue,
            collapsibleState: TreeItemCollapsibleState.Collapsed,
        }
    }
}
