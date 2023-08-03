/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode, Revision, ScaleRule } from "@azure/arm-appcontainers";
import type { AzureSubscription, ViewPropertiesModel } from "@microsoft/vscode-azureresources-api";
import * as deepEqual from "deep-eql";
import { ThemeIcon, TreeItem } from "vscode";
import { localize } from "../../utils/localize";
import type { ContainerAppModel } from "../ContainerAppItem";
import { RevisionDraftItem, RevisionsDraftModel } from "../revisionManagement/RevisionDraftItem";
import type { RevisionsItemModel } from "../revisionManagement/RevisionItem";

const scaleRuleLabel: string = localize('scaleRule', 'Scale Rule');

export class ScaleRuleItem implements RevisionsItemModel, RevisionsDraftModel {
    static readonly contextValue: string = 'scaleRuleItem';
    static readonly contextValueRegExp: RegExp = new RegExp(ScaleRuleItem.contextValue);

    constructor(
        readonly subscription: AzureSubscription,
        readonly containerApp: ContainerAppModel,
        readonly revision: Revision,

        // Used as the basis for the view; can reflect either the original or the draft changes
        readonly scaleRule: ScaleRule,
        readonly hasDraft: boolean) { }

    id: string = `${this.parentResource.id}/scalerules/${this.scaleRule.name}`;

    viewProperties: ViewPropertiesModel = {
        data: this.scaleRule,
        label: `${this.parentResource.name} ${scaleRuleLabel} ${this.scaleRule.name}`,
    };

    private get description(): string {
        if (this.scaleRule.http) {
            return localize('http', "HTTP");
        } else if (this.scaleRule.azureQueue) {
            return localize('azureQueue', 'Azure Queue');
        } else if (this.scaleRule.custom) {
            return localize('custom', 'Custom');
        } else {
            return localize('unknown', 'Unknown');
        }
    }

    private get parentResource(): ContainerAppModel | Revision {
        return this.containerApp.revisionsMode === KnownActiveRevisionsMode.Single ? this.containerApp : this.revision;
    }

    getTreeItem(): TreeItem {
        return {
            id: this.id,
            label: this.hasUnsavedChanges() ? `${this.scaleRule.name}*` : this.scaleRule.name,
            contextValue: ScaleRuleItem.contextValue,
            iconPath: new ThemeIcon('dash'),
            description: this.description
        }
    }

    hasUnsavedChanges(): boolean {
        // We only care about showing changes to descendants of the revision draft item when in multiple revisions mode
        if (this.containerApp.revisionsMode === KnownActiveRevisionsMode.Multiple && !RevisionDraftItem.hasDescendant(this)) {
            return false;
        }

        if (!this.hasDraft) {
            return false;
        }

        const currentRules: ScaleRule[] = this.parentResource.template?.scale?.rules ?? [];
        const currentRule: ScaleRule | undefined = currentRules.find(rule => rule.name === this.scaleRule.name);

        return !currentRule || !deepEqual(this.scaleRule, currentRule);
    }
}
