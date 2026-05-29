/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode, type Container, type Revision } from "@azure/arm-appcontainers";
import { nonNullValueAndProp, type TreeElementBase } from "@microsoft/vscode-azext-utils";
import { type AzureSubscription, type ViewPropertiesModel } from "@microsoft/vscode-azureresources-api";
import deepEqual from 'deep-eql';
import { TreeItemCollapsibleState, type TreeItem } from "vscode";
import { ext } from "../../extensionVariables";
import { localize } from "../../utils/localize";
import { treeUtils } from "../../utils/treeUtils";
import { type ContainerAppModel } from "../ContainerAppItem";
import { RevisionDraftDescendantBase } from "../revisionManagement/RevisionDraftDescendantBase";
import { ContainerItem } from "./ContainerItem";
import { EnvironmentVariablesItem } from "./EnvironmentVariablesItem";
import { ImageItem } from "./ImageItem";

export const container: string = localize('container', 'Container');
export const containers: string = localize('containers', 'Containers');

export class ContainersItem extends RevisionDraftDescendantBase {
    label: string;

    static readonly contextValue: string = 'containersItem';
    static readonly contextValueRegExp: RegExp = new RegExp(ContainersItem.contextValue);

    constructor(
        subscription: AzureSubscription,
        containerApp: ContainerAppModel,
        revision: Revision,

        // Used as the basis for the view; can reflect either the original or the draft changes
        private containers: Container[],
    ) {
        super(subscription, containerApp, revision);
    }

    get id(): string {
        return this.buildId('containers');
    }

    getChildren(): TreeElementBase[] {
        if (this.containers.length === 1) {
            return [
                this.createChildItem(ImageItem, 0, this.containers[0]),
                this.createChildItem(EnvironmentVariablesItem, 0, this.containers[0]),
            ];
        }
        return this.containers?.map((c, idx) => this.createChildItem(ContainerItem, idx, c)) ?? [];
    }

    getTreeItem(): TreeItem {
        return {
            id: this.id,
            label: this.label,
            iconPath: treeUtils.getIconPath('containers'),
            contextValue: this.contextValue,
            collapsibleState: TreeItemCollapsibleState.Collapsed
        };
    }

    private get contextValue(): string {
        return this.parentResource.template?.containers?.length === 1 ? ContainerItem.contextValue : ContainersItem.contextValue;
    }

    protected setProperties(): void {
        this.containers = nonNullValueAndProp(this.parentResource.template, 'containers');
        this.label = this.containers.length === 1 ? container : containers;
    }

    protected setDraftProperties(): void {
        this.containers = nonNullValueAndProp(ext.revisionDraftFileSystem.parseRevisionDraft(this), 'containers');
        this.label = this.containers.length === 1 ? `${container}*` : `${containers}*`;
    }

    viewProperties: ViewPropertiesModel = {
        label: 'Containers',
        getData: async () => {
            return this.containers.length === 1 ? this.containers[0] : JSON.stringify(this.containers);
        }
    };

    static isContainersItem(item: unknown): item is ContainersItem {
        return typeof item === 'object' &&
            typeof (item as ContainersItem).id === 'string' &&
            (item as ContainersItem).id.endsWith('/containers');
    }

    hasUnsavedChanges(): boolean {
        // We only care about showing changes to descendants of the revision draft item when in multiple revisions mode
        if (this.containerApp.revisionsMode === KnownActiveRevisionsMode.Multiple && !this.isDraftDescendant) {
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
