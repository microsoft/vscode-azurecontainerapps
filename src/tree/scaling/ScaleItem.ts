/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode, Revision, Scale } from "@azure/arm-appcontainers";
import { createGenericElement, nonNullValueAndProp } from "@microsoft/vscode-azext-utils";
import type { AzureSubscription, ViewPropertiesModel } from "@microsoft/vscode-azureresources-api";
import * as deepEqual from 'deep-eql';
import { ThemeIcon, TreeItem, TreeItemCollapsibleState } from "vscode";
import { ext } from "../../extensionVariables";
import { localize } from "../../utils/localize";
import { treeUtils } from "../../utils/treeUtils";
import type { ContainerAppModel } from "../ContainerAppItem";
import type { TreeElementBase } from "../ContainerAppsBranchDataProvider";
import { RevisionDraftItem, RevisionsDraftModel } from "../revisionManagement/RevisionDraftItem";
import type { RevisionsItemModel } from "../revisionManagement/RevisionItem";
import { ScaleRuleGroupItem } from "./ScaleRuleGroupItem";

const minMaxReplicaItemContextValue: string = 'minMaxReplicaItem';

const scaling: string = localize('scaling', 'Scaling');

export class ScaleItem implements RevisionsItemModel, RevisionsDraftModel {
    static readonly contextValue: string = 'scaleItem';
    static readonly contextValueRegExp: RegExp = new RegExp(ScaleItem.contextValue);

    // Used as the basis for the view; can reflect either the original or the draft changes
    private readonly scale: Scale;

    constructor(
        readonly subscription: AzureSubscription,
        readonly containerApp: ContainerAppModel,
        readonly revision: Revision
    ) {
        if (this.hasUnsavedChanges()) {
            this.label = `${scaling}*`;
            this.scale = nonNullValueAndProp(ext.revisionDraftFileSystem.parseRevisionDraft(this), 'scale');
        } else {
            this.label = scaling;
            this.scale = nonNullValueAndProp(this.parentResource.template, 'scale');
        }
    }

    id: string = `${this.parentResource.id}/scale`;
    label: string;

    // Use getter here because some properties aren't available until after the constructor is run
    get viewProperties(): ViewPropertiesModel {
        return {
            data: this.scale,
            label: `${this.parentResource.name} Scaling`,
        };
    }

    private get parentResource(): ContainerAppModel | Revision {
        return this.containerApp.revisionsMode === KnownActiveRevisionsMode.Single ? this.containerApp : this.revision;
    }

    getTreeItem(): TreeItem {
        return {
            id: this.id,
            label: this.label,
            contextValue: ScaleItem.contextValue,
            iconPath: treeUtils.getIconPath('scaling'),
            collapsibleState: TreeItemCollapsibleState.Collapsed,
        }
    }

    getChildren(): TreeElementBase[] {
        const replicasLabel: string = localize('minMax', 'Min / max replicas');
        return [
            createGenericElement({
                label: this.replicasHaveUnsavedChanges() ? `${replicasLabel}*` : replicasLabel,
                description: `${this.scale?.minReplicas ?? 0} / ${this.scale?.maxReplicas ?? 0}`,
                contextValue: minMaxReplicaItemContextValue,
                iconPath: new ThemeIcon('dash'),
            }),
            new ScaleRuleGroupItem(this.subscription, this.containerApp, this.revision),
        ];
    }

    hasUnsavedChanges(): boolean {
        // We only care about showing changes to descendants of the revision draft item when in multiple revisions mode
        if (this.containerApp.revisionsMode === KnownActiveRevisionsMode.Multiple && !RevisionDraftItem.hasDescendant(this)) {
            return false;
        }

        const draftTemplate = ext.revisionDraftFileSystem.parseRevisionDraft(this)?.scale;
        const currentTemplate = this.parentResource.template?.scale;

        if (!draftTemplate || !currentTemplate) {
            return false;
        }

        return !deepEqual(currentTemplate, draftTemplate);
    }

    private replicasHaveUnsavedChanges(): boolean {
        if (this.containerApp.revisionsMode === KnownActiveRevisionsMode.Multiple && !RevisionDraftItem.hasDescendant(this)) {
            return false;
        }

        const draftTemplate = ext.revisionDraftFileSystem.parseRevisionDraft(this)?.scale;
        const currentTemplate = this.parentResource.template?.scale;

        if (!draftTemplate || !currentTemplate) {
            return false;
        }

        return draftTemplate.minReplicas !== currentTemplate.minReplicas || draftTemplate.maxReplicas !== draftTemplate.maxReplicas;
    }
}
