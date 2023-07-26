/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { Revision } from "@azure/arm-appcontainers";
import { uiUtils } from "@microsoft/vscode-azext-azureutils";
import { TreeElementBase, callWithTelemetryAndErrorHandling, createContextValue, createSubscriptionContext } from "@microsoft/vscode-azext-utils";
import type { AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { TreeItem, TreeItemCollapsibleState } from "vscode";
import { revisionDraftFalseContextValue, revisionDraftTrueContextValue } from "../../constants";
import { ext } from "../../extensionVariables";
import { createContainerAppsAPIClient } from "../../utils/azureClients";
import { localize } from "../../utils/localize";
import { treeUtils } from "../../utils/treeUtils";
import type { ContainerAppModel } from "../ContainerAppItem";
import type { ContainerAppsItem } from "../ContainerAppsBranchDataProvider";
import { RevisionDraftItem } from "./RevisionDraftItem";
import { RevisionItem } from "./RevisionItem";

export class RevisionsItem implements ContainerAppsItem {
    static readonly idSuffix: string = 'revisions';
    static readonly contextValue: string = 'revisionsItem';
    static readonly contextValueRegExp: RegExp = new RegExp(RevisionsItem.contextValue);

    id: string;

    constructor(public readonly subscription: AzureSubscription, public readonly containerApp: ContainerAppModel) {
        this.id = `${containerApp.id}/${RevisionsItem.idSuffix}`;
    }

    private get contextValue(): string {
        const values: string[] = [RevisionsItem.contextValue];
        values.push(ext.revisionDraftFileSystem.doesContainerAppsItemHaveRevisionDraft(this) ? revisionDraftTrueContextValue : revisionDraftFalseContextValue);
        return createContextValue(values);
    }

    async getChildren(): Promise<TreeElementBase[]> {
        const revisionDraftBaseName: string | undefined = ext.revisionDraftFileSystem.getRevisionDraftFile(this)?.baseRevisionName;
        let draftBaseRevision: Revision | undefined;

        const result = (await callWithTelemetryAndErrorHandling('getChildren', async (context) => {
            const client = await createContainerAppsAPIClient([context, createSubscriptionContext(this.subscription)]);
            const revisions = await uiUtils.listAllIterator(client.containerAppsRevisions.listRevisions(this.containerApp.resourceGroup, this.containerApp.name));
            return revisions.map(revision => {
                if (revision.name === revisionDraftBaseName) {
                    draftBaseRevision = revision;
                }
                return new RevisionItem(this.subscription, this.containerApp, revision)
            });
        }))?.reverse() ?? [];

        return draftBaseRevision ? [
            new RevisionDraftItem(this.subscription, this.containerApp, draftBaseRevision),
            ...result.filter(item => item.revision.name !== revisionDraftBaseName)
        ] : result;
    }

    getTreeItem(): TreeItem {
        return {
            label: localize('revisions', 'Revision Management'),
            iconPath: treeUtils.getIconPath('revision-management'),
            contextValue: this.contextValue,
            collapsibleState: TreeItemCollapsibleState.Collapsed,
        };
    }
}
