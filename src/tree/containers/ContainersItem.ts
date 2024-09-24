/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode, type Container, type Revision } from "@azure/arm-appcontainers";
import { createContextValue, nonNullValue, nonNullValueAndProp, type TreeElementBase } from "@microsoft/vscode-azext-utils";
import { type AzureSubscription, type ViewPropertiesModel } from "@microsoft/vscode-azureresources-api";
import * as deepEqual from 'deep-eql';
import { TreeItemCollapsibleState, type TreeItem } from "vscode";
import { revisionDraftFalseContextValue, revisionDraftTrueContextValue, revisionModeMultipleContextValue, revisionModeSingleContextValue } from "../../constants";
import { ext } from "../../extensionVariables";
import { getParentResource } from "../../utils/revisionDraftUtils";
import { treeUtils } from "../../utils/treeUtils";
import { type ContainerAppModel } from "../ContainerAppItem";
import { RevisionDraftDescendantBase } from "../revisionManagement/RevisionDraftDescendantBase";
import { RevisionDraftItem } from "../revisionManagement/RevisionDraftItem";
import { ContainerItem } from "./ContainerItem";
import { EnvironmentVariablesItem } from "./EnvironmentVariablesItem";
import { ImageItem } from "./ImageItem";

export class ContainersItem extends RevisionDraftDescendantBase {
    id: string;
    label: string;
    private containers: Container[] = [];

    static readonly contextValue: string = 'containersItem';
    static readonly contextValueRegExp: RegExp = new RegExp(ContainersItem.contextValue);

    constructor(subscription: AzureSubscription, containerApp: ContainerAppModel, revision: Revision) {
        super(subscription, containerApp, revision);
        this.id = `${this.parentResource.id}/${this.parentResource.template?.containers?.length === 1 ? 'container' : 'containers'}`;
        this.containers = nonNullValueAndProp(this.parentResource.template, 'containers');
    }

    getChildren(): TreeElementBase[] {
        if (this.containers.length === 1) {
            return [
                new ImageItem(this.subscription, this.containerApp, this.revision, this.id, this.containers[0]),
                new EnvironmentVariablesItem(this.subscription, this.containerApp, this.revision, this.id, this.containers[0]),
            ];
        }
        return nonNullValue(this.containers?.map(container => new ContainerItem(this.subscription, this.containerApp, this.revision, container)));
    }

    getTreeItem(): TreeItem {
        return {
            id: this.id,
            label: this.label,
            iconPath: treeUtils.getIconPath('containers'),
            contextValue: this.contextValue,
            collapsibleState: TreeItemCollapsibleState.Collapsed
        }
    }

    private get contextValue(): string {
        const values: string[] = [ContainersItem.contextValue];
        if (this.containers.length === 1) {
            values.push(ContainerItem.contextValue);
        }

        values.push(ext.revisionDraftFileSystem.doesContainerAppsItemHaveRevisionDraft(this) ? revisionDraftTrueContextValue : revisionDraftFalseContextValue);
        values.push(this.containerApp.revisionsMode === KnownActiveRevisionsMode.Single ? revisionModeSingleContextValue : revisionModeMultipleContextValue);
        return createContextValue(values);
    }

    private get parentResource(): ContainerAppModel | Revision {
        return getParentResource(this.containerApp, this.revision);
    }

    protected setProperties(): void {
        this.label = this.containers.length === 1 ? 'Container' : 'Containers';
        this.containers = nonNullValueAndProp(this.parentResource.template, 'containers');
    }

    protected setDraftProperties(): void {
        this.label = this.containers.length === 1 ? 'Container*' : 'Containers*';
        this.containers = nonNullValueAndProp(ext.revisionDraftFileSystem.parseRevisionDraft(this), 'containers');
    }

    viewProperties: ViewPropertiesModel = {
        label: 'Containers',
        getData: async () => {
            return this.containers.length === 1 ? this.containers[0] : JSON.stringify(this.containers)
        }
    }

    static isContainersItem(item: unknown): item is ContainersItem {
        return typeof item === 'object' &&
            typeof (item as ContainersItem).contextValue === 'string' &&
            ContainersItem.contextValueRegExp.test((item as ContainersItem).contextValue);
    }

    hasUnsavedChanges(): boolean {
        // We only care about showing changes to descendants of the revision draft item when in multiple revisions mode
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
