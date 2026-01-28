/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type ContainerAppsAPIClient, type KnownActiveRevisionsMode, type Revision, type Template } from "@azure/arm-appcontainers";
import { uiUtils } from "@microsoft/vscode-azext-azureutils";
import { callWithTelemetryAndErrorHandling, createContextValue, createSubscriptionContext, nonNullProp, type IActionContext, type TreeElementBase } from "@microsoft/vscode-azext-utils";
import { type AzureSubscription } from "@microsoft/vscode-azureresources-api";
import deepEqual from "deep-eql";
import { TreeItemCollapsibleState, type TreeItem } from "vscode";
import { unsavedChangesFalseContextValue, unsavedChangesTrueContextValue } from "../../constants";
import { ext } from "../../extensionVariables";
import { createContainerAppsAPIClient } from "../../utils/azureClients";
import { localize } from "../../utils/localize";
import { treeUtils } from "../../utils/treeUtils";
import { type ContainerAppModel } from "../ContainerAppItem";
import { RevisionItem, type RevisionsItemModel } from "./RevisionItem";

// For tree items that depend on the container app's revision draft template
export interface RevisionsDraftModel {
    hasUnsavedChanges(): boolean | Promise<boolean>;
}

export class RevisionDraftItem implements RevisionsItemModel, RevisionsDraftModel {
    static readonly idSuffix: string = 'revisionDraft';
    static readonly contextValue: string = 'revisionDraftItem';
    static readonly contextValueRegExp: RegExp = new RegExp(RevisionDraftItem.contextValue);

    id: string;
    revisionsMode: KnownActiveRevisionsMode;

    constructor(readonly subscription: AzureSubscription, readonly containerApp: ContainerAppModel, readonly revision: Revision) {
        this.id = RevisionDraftItem.getRevisionDraftItemId(containerApp.id);
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

    private async getContextValues(): Promise<string> {
        const values: string[] = [RevisionDraftItem.contextValue];
        values.push(await this.hasUnsavedChanges() ? unsavedChangesTrueContextValue : unsavedChangesFalseContextValue);
        return createContextValue(values);
    }

    static getRevisionDraftItemId(containerAppId: string): string {
        return `${containerAppId}/${RevisionDraftItem.idSuffix}`;
    }

    static isRevisionDraftItem(item: unknown): item is RevisionDraftItem {
        return typeof item === 'object' &&
            typeof (item as RevisionDraftItem).id === 'string' &&
            (item as RevisionDraftItem).id.split('/').at(-1) === RevisionDraftItem.idSuffix;
    }

    static hasDescendant(item: RevisionsItemModel): boolean {
        if (RevisionDraftItem.isRevisionDraftItem(item)) {
            return false;
        }

        const revisionDraftBaseName: string | undefined = ext.revisionDraftFileSystem.getRevisionDraftFile(item)?.baseRevisionName;
        return item.revision.name === revisionDraftBaseName;
    }

    async getTreeItem(): Promise<TreeItem> {
        return {
            id: this.id,
            label: localize('draft', 'Draft'),
            iconPath: treeUtils.getIconPath('revision-draft'),
            description: this.containerApp.latestRevisionName === this.revisionName ?
                localize('basedOnLatestRevision', 'Based on "{0}" (Latest)', this.baseRevisionName) :
                localize('basedOnRevision', 'Based on "{0}"', this.baseRevisionName),
            contextValue: await this.getContextValues(),
            collapsibleState: TreeItemCollapsibleState.Expanded
        };
    }

    getChildren(): TreeElementBase[] {
        return RevisionItem.getTemplateChildren(this.subscription, this.containerApp, this.revision);
    }

    async hasUnsavedChanges(): Promise<boolean> {
        const revisions: Revision[] | undefined = await callWithTelemetryAndErrorHandling('revisionDraftItem.hasUnsavedChanges.getRevisions', async (context: IActionContext) => {
            const client: ContainerAppsAPIClient = await createContainerAppsAPIClient([context, createSubscriptionContext(this.subscription)]);
            return uiUtils.listAllIterator(client.containerAppsRevisions.listRevisions(this.containerApp.resourceGroup, this.containerApp.name));
        });

        const baseRevisionName: string | undefined = ext.revisionDraftFileSystem.getRevisionDraftFile(this)?.baseRevisionName;
        const baseRevision: Revision | undefined = revisions?.find(revision => baseRevisionName && revision.name === baseRevisionName);
        const draftTemplate: Template | undefined = ext.revisionDraftFileSystem.parseRevisionDraft(this);

        if (!baseRevision?.template || !draftTemplate) {
            return false;
        }

        return !deepEqual(baseRevision.template, draftTemplate);
    }
}
