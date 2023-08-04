/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode, Revision, ScaleRule } from "@azure/arm-appcontainers";
import type { TreeElementBase } from "@microsoft/vscode-azext-utils";
import type { AzureSubscription, ViewPropertiesModel } from "@microsoft/vscode-azureresources-api";
import * as deepEqual from "deep-eql";
import { ThemeIcon, TreeItem, TreeItemCollapsibleState } from "vscode";
import { ext } from "../../extensionVariables";
import { localize } from "../../utils/localize";
import type { ContainerAppModel } from "../ContainerAppItem";
import { RevisionDraftItem, RevisionsDraftModel } from "../revisionManagement/RevisionDraftItem";
import type { RevisionsItemModel } from "../revisionManagement/RevisionItem";
import { ScaleRuleItem } from "./ScaleRuleItem";

const scaleRulesLabel: string = localize('scaleRules', 'Scale Rules');

export class ScaleRuleGroupItem implements RevisionsItemModel, RevisionsDraftModel {
    static readonly contextValue: string = 'scaleRuleGroupItem';
    static readonly contextValueRegExp: RegExp = new RegExp(ScaleRuleGroupItem.contextValue);

    // Used as the basis for the view; can reflect either the original or the draft changes
    private readonly scaleRules: ScaleRule[];

    constructor(
        readonly subscription: AzureSubscription,
        readonly containerApp: ContainerAppModel,
        readonly revision: Revision
    ) {
        if (this.hasUnsavedChanges()) {
            this.scaleRules = ext.revisionDraftFileSystem.parseRevisionDraft(this)?.scale?.rules ?? [];
            this.label = `${scaleRulesLabel}*`;
        } else {
            this.scaleRules = this.parentResource.template?.scale?.rules ?? [];
            this.label = scaleRulesLabel;
        }
    }

    id: string = `${this.parentResource.id}/scalerules`;
    label: string;

    // Use getter here because some properties aren't available until after the constructor is run
    get viewProperties(): ViewPropertiesModel {
        return {
            data: this.scaleRules,
            label: `${this.parentResource.name} ${scaleRulesLabel}`,
        };
    }

    private get parentResource(): ContainerAppModel | Revision {
        return this.containerApp.revisionsMode === KnownActiveRevisionsMode.Single ? this.containerApp : this.revision;
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
        return this.scaleRules.map(scaleRule => new ScaleRuleItem(this.subscription, this.containerApp, this.revision, scaleRule, this.hasUnsavedChanges())) ?? [];
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
