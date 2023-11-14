/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type Revision } from "@azure/arm-appcontainers";
import { uiUtils } from "@microsoft/vscode-azext-azureutils";
import { callWithTelemetryAndErrorHandling, createContextValue, createSubscriptionContext, type TreeElementBase } from "@microsoft/vscode-azext-utils";
import { type AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { TreeItemCollapsibleState, type TreeItem } from "vscode";
import { revisionDraftFalseContextValue, revisionDraftTrueContextValue } from "../../constants";
import { ext } from "../../extensionVariables";
import { createContainerAppsAPIClient } from "../../utils/azureClients";
import { localize } from "../../utils/localize";
import { treeUtils } from "../../utils/treeUtils";
import { type ContainerAppModel } from "../ContainerAppItem";
import { type ContainerAppsItem } from "../ContainerAppsBranchDataProvider";
import { RevisionDraftItem } from "./RevisionDraftItem";
import { RevisionItem } from "./RevisionItem";

export class RevisionsItem implements ContainerAppsItem {
    static readonly contextValue: string = 'revisionsItem';
    static readonly contextValueRegExp: RegExp = new RegExp(RevisionsItem.contextValue);

    id: string;

    constructor(public readonly subscription: AzureSubscription, public readonly containerApp: ContainerAppModel) {
        this.id = RevisionsItem.getRevisionsItemId(containerApp.id);
    }

    private get contextValue(): string {
        const values: string[] = [RevisionsItem.contextValue];
        values.push(ext.revisionDraftFileSystem.doesContainerAppsItemHaveRevisionDraft(this) ? revisionDraftTrueContextValue : revisionDraftFalseContextValue);
        return createContextValue(values);
    }

    static getRevisionsItemId(containerAppId: string): string {
        return `${containerAppId}/revisions`;
    }

    async getChildren(): Promise<TreeElementBase[]> {
        let revisionDraftBase: Revision | undefined;
        const revisionDraftBaseName: string | undefined = ext.revisionDraftFileSystem.getRevisionDraftFile(this)?.baseRevisionName;

        const result = (await callWithTelemetryAndErrorHandling('getChildren', async (context) => {
            const client = await createContainerAppsAPIClient([context, createSubscriptionContext(this.subscription)]);
            const revisions = await uiUtils.listAllIterator(client.containerAppsRevisions.listRevisions(this.containerApp.resourceGroup, this.containerApp.name));
            return revisions.map(revision => {
                if (revision.name === revisionDraftBaseName) {
                    revisionDraftBase = revision;
                }
                return new RevisionItem(this.subscription, this.containerApp, revision)
            });
        }))?.reverse() ?? [];

        return revisionDraftBase ? [
            new RevisionDraftItem(this.subscription, this.containerApp, revisionDraftBase),
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
