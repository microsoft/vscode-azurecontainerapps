/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { Container, KnownActiveRevisionsMode, Revision } from "@azure/arm-appcontainers";
import { TreeElementBase, nonNullValue, nonNullValueAndProp } from "@microsoft/vscode-azext-utils";
import { AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { TreeItem, TreeItemCollapsibleState } from "vscode";
import { ext } from "../../extensionVariables";
import { localize } from "../../utils/localize";
import { treeUtils } from "../../utils/treeUtils";
import { ContainerAppModel } from "../ContainerAppItem";
import { RevisionDraftItem, RevisionsDraftModel } from "../revisionManagement/RevisionDraftItem";
import { RevisionsItemModel } from "../revisionManagement/RevisionItem";
import { ContainerItem } from "./ContainerItem";
import deepEqual = require("deep-eql");

const containers: string = localize('containers', 'Containers');

export class ContainersItem implements RevisionsItemModel, RevisionsDraftModel {
    id: string;
    label: string;
    private readonly containers: Container[];

    constructor(public readonly subscription: AzureSubscription, public readonly containerApp: ContainerAppModel, public readonly revision: Revision) {
        if (this.hasUnsavedChanges()) {
            this.label = `${containers}*`;
            this.containers = nonNullValueAndProp(ext.revisionDraftFileSystem.parseRevisionDraft(this), 'containers');
        } else {
            this.label = containers;
            this.containers = nonNullValueAndProp(this.parentResource.template, 'containers');
        }

        this.id = `${containerApp.id}/containers`;
    }

    private get parentResource(): ContainerAppModel | Revision {
        return this.containerApp.revisionsMode === KnownActiveRevisionsMode.Single ? this.containerApp : this.revision;
    }

    getChildren(): TreeElementBase[] {
        return nonNullValue(this.containers?.map(container => new ContainerItem(this.subscription, this.containerApp, this.revision, container)));
    }

    getTreeItem(): TreeItem {
        return {
            id: this.id,
            label: this.label,
            iconPath: treeUtils.getIconPath('scaling'), // just a placeholder until we find the containers icon
            collapsibleState: TreeItemCollapsibleState.Collapsed
        }
    }

    hasUnsavedChanges(): boolean {
        if (this.containerApp.revisionsMode === KnownActiveRevisionsMode.Multiple && !RevisionDraftItem.hasDescendant(this)) {
            return false;
        }

        const draftTemplate = ext.revisionDraftFileSystem.parseRevisionDraft(this)?.containers;
        const currentTemplate = this.parentResource.template?.containers;

        if (!draftTemplate) {
            return false;
        }

        return !deepEqual(currentTemplate, draftTemplate);

    }
}
