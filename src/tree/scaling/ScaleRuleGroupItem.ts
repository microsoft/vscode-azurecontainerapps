/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode, type Revision, type ScaleRule } from "@azure/arm-appcontainers";
import { type TreeElementBase } from "@microsoft/vscode-azext-utils";
import { type AzureSubscription, type ViewPropertiesModel } from "@microsoft/vscode-azureresources-api";
import * as deepEqual from "deep-eql";
import { ThemeIcon, TreeItemCollapsibleState, type TreeItem } from "vscode";
import { ext } from "../../extensionVariables";
import { localize } from "../../utils/localize";
import { getParentResource } from "../../utils/revisionDraftUtils";
import { treeUtils } from "../../utils/treeUtils";
import { type ContainerAppModel } from "../ContainerAppItem";
import { RevisionDraftDescendantBase } from "../revisionManagement/RevisionDraftDescendantBase";
import { RevisionDraftItem } from "../revisionManagement/RevisionDraftItem";
import { ScaleRuleItem } from "./ScaleRuleItem";

const scaleRulesLabel: string = localize('scaleRules', 'Scale Rules');

export class ScaleRuleGroupItem extends RevisionDraftDescendantBase {
    static readonly contextValue: string = 'scaleRuleGroupItem';
    static readonly contextValueRegExp: RegExp = new RegExp(ScaleRuleGroupItem.contextValue);

    // Used as the basis for the view; can reflect either the original or the draft changes
    private scaleRules: ScaleRule[];

    constructor(subscription: AzureSubscription, containerApp: ContainerAppModel, revision: Revision) {
        super(subscription, containerApp, revision);
    }

    id: string = `${this.parentResource.id}/scalerules`;
    label: string;

    // Todo: Update to use 'getData' after PR merges adding containerIdx
    // Use getter here because some properties aren't available until after the constructor is run
    get viewProperties(): ViewPropertiesModel {
        return {
            data: this.scaleRules,
            label: `${this.parentResource.name} ${scaleRulesLabel}`,
        };
    }

    private get parentResource(): ContainerAppModel | Revision {
        return getParentResource(this.containerApp, this.revision);
    }

    protected setProperties(): void {
        this.label = scaleRulesLabel;
        this.scaleRules = this.parentResource.template?.scale?.rules ?? [];
    }

    protected setDraftProperties(): void {
        this.label = `${scaleRulesLabel}*`;
        this.scaleRules = ext.revisionDraftFileSystem.parseRevisionDraft(this)?.scale?.rules ?? [];
    }

    getTreeItem(): TreeItem {
        return {
            id: this.id,
            label: this.label,
            contextValue: ScaleRuleGroupItem.contextValue,
            iconPath: new ThemeIcon('symbol-constant'),
            collapsibleState: TreeItemCollapsibleState.Collapsed,
        }
    }

    getChildren(): TreeElementBase[] {
        return this.scaleRules
            .map(scaleRule => RevisionDraftDescendantBase.createTreeItem(ScaleRuleItem, this.subscription, this.containerApp, this.revision, scaleRule, this.hasUnsavedChanges()))
            .sort((a, b) => treeUtils.sortById(a, b));
    }

    hasUnsavedChanges(): boolean {
        // We only care about showing changes to descendants of the revision draft item when in multiple revisions mode
        if (this.containerApp.revisionsMode === KnownActiveRevisionsMode.Multiple && !RevisionDraftItem.hasDescendant(this)) {
            return false;
        }

        const draftTemplate: ScaleRule[] | undefined = ext.revisionDraftFileSystem.parseRevisionDraft(this)?.scale?.rules;
        const currentTemplate: ScaleRule[] | undefined = this.parentResource.template?.scale?.rules;

        if (!draftTemplate) {
            return false;
        }

        return !deepEqual(currentTemplate, draftTemplate);
    }
}
