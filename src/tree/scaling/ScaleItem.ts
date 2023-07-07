/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode, Revision, Scale } from "@azure/arm-appcontainers";
import { createGenericElement, nonNullValue } from "@microsoft/vscode-azext-utils";
import type { AzureSubscription, ViewPropertiesModel } from "@microsoft/vscode-azureresources-api";
import { ThemeIcon, TreeItem, TreeItemCollapsibleState } from "vscode";
import { ext } from "../../extensionVariables";
import { isDeepEqual } from "../../utils/isDeepEqual";
import { localize } from "../../utils/localize";
import { treeUtils } from "../../utils/treeUtils";
import type { ContainerAppModel } from "../ContainerAppItem";
import type { TreeElementBase } from "../ContainerAppsBranchDataProvider";
import type { RevisionsItemModel } from "../revisionManagement/RevisionItem";
import { createScaleRuleGroupItem } from "./ScaleRuleGroupItem";

const minMaxReplicaItemContextValue: string = 'minMaxReplicaItem';

const scaling: string = localize('scaling', 'Scaling');

export class ScaleItem implements RevisionsItemModel {
    static readonly contextValue: string = 'scaleItem';
    static readonly contextValueRegExp: RegExp = new RegExp(ScaleItem.contextValue);

    constructor(
        readonly subscription: AzureSubscription,
        readonly containerApp: ContainerAppModel,
        readonly revision: Revision) { }

    id: string = `${this.parentResource.id}/scale`;

    viewProperties: ViewPropertiesModel = {
        data: this.scale,
        label: `${this.parentResource.name} Scaling`,
    };

    get scale(): Scale {
        return nonNullValue(this.revision?.template?.scale);
    }

    get parentResource(): ContainerAppModel | Revision {
        return this.revision?.name === this.containerApp.latestRevisionName ? this.containerApp : this.revision;
    }

    getTreeItem(): TreeItem {
        return {
            id: this.id,
            label: this.hasUnsavedChanges() ? `${scaling}*` : scaling,
            contextValue: ScaleItem.contextValue,
            iconPath: treeUtils.getIconPath('scaling'),
            collapsibleState: TreeItemCollapsibleState.Collapsed,
        }
    }

    getChildren(): TreeElementBase[] {
        let scale: Scale | undefined;

        if (this.hasUnsavedChanges()) {
            scale = ext.revisionDraftFileSystem.parseRevisionDraft(this)?.scale;
        } else if (this.containerApp.revisionsMode === KnownActiveRevisionsMode.Single) {
            scale = this.containerApp.template?.scale;
        } else {
            scale = this.revision.template?.scale;
        }

        return [
            createGenericElement({
                label: localize('minMax', 'Min / max replicas'),
                description: `${scale?.minReplicas ?? 0} / ${scale?.maxReplicas ?? 0}`,
                contextValue: minMaxReplicaItemContextValue,
                iconPath: new ThemeIcon('dash'),
            }),
            createScaleRuleGroupItem(this.subscription, this.containerApp, this.revision, scale?.rules ?? []),
        ];
    }

    private hasUnsavedChanges(): boolean {
        const scaleDraftTemplate = ext.revisionDraftFileSystem.parseRevisionDraft(this)?.scale;
        if (!scaleDraftTemplate) {
            return false;
        }

        if (this.containerApp.revisionsMode === KnownActiveRevisionsMode.Single) {
            return !!this.containerApp.template?.scale && !isDeepEqual(this.containerApp.template.scale, scaleDraftTemplate);
        } else {
            // We only care about showing changes to descendants of the revision draft item when in multiple revisions mode
            // return !!this.revision.template?.scale && RevisionDraftItem.hasDescendant(this) && !isDeepEqual(this.revision.template.scale, scaleDraftTemplate);

            return false;  // Placeholder
        }
    }
}
