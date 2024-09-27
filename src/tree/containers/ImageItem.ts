/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode, type Container, type Revision } from "@azure/arm-appcontainers";
import { createContextValue, createGenericElement, nonNullValue, nonNullValueAndProp, type TreeElementBase } from "@microsoft/vscode-azext-utils";
import { type AzureSubscription, type ViewPropertiesModel } from "@microsoft/vscode-azureresources-api";
import { ThemeIcon, TreeItemCollapsibleState, type TreeItem } from "vscode";
import { draftItemDescendantFalseContextValue, draftItemDescendantTrueContextValue, revisionDraftFalseContextValue, revisionDraftTrueContextValue, revisionModeMultipleContextValue, revisionModeSingleContextValue } from "../../constants";
import { ext } from "../../extensionVariables";
import { localize } from "../../utils/localize";
import { getParentResource } from "../../utils/revisionDraftUtils";
import { type ContainerAppModel } from "../ContainerAppItem";
import { RevisionDraftDescendantBase } from "../revisionManagement/RevisionDraftDescendantBase";
import { RevisionDraftItem } from "../revisionManagement/RevisionDraftItem";

export class ImageItem extends RevisionDraftDescendantBase {
    static readonly contextValue: string = 'imageItem';
    static readonly contextValueRegExp: RegExp = new RegExp(ImageItem.contextValue);

    readonly loginServer = this.container.image?.split('/')[0];
    readonly imageAndTag = this.container.image?.substring(nonNullValue(this.loginServer?.length) + 1, this.container.image?.length);

    constructor(
        subscription: AzureSubscription,
        containerApp: ContainerAppModel,
        revision: Revision,
        readonly containersIdx: number,

        // Used as the basis for the view; can reflect either the original or the draft changes
        readonly container: Container,
    ) {
        super(subscription, containerApp, revision);
    }

    id: string = `${this.parentResource.id}/image/${this.imageAndTag}`
    label: string;

    viewProperties: ViewPropertiesModel = {
        data: nonNullValueAndProp(this.container, 'image'),
        label: this.container.name ?? '',
    }

    private get contextValue(): string {
        const values: string[] = [ImageItem.contextValue];

        if (this.containerApp.revisionsMode === KnownActiveRevisionsMode.Multiple && ext.revisionDraftFileSystem.doesContainerAppsItemHaveRevisionDraft(this)) {
            values.push(revisionDraftTrueContextValue);
        } else {
            values.push(revisionDraftFalseContextValue);
        }

        values.push(RevisionDraftItem.hasDescendant(this) ? draftItemDescendantTrueContextValue : draftItemDescendantFalseContextValue);
        values.push(this.containerApp.revisionsMode === KnownActiveRevisionsMode.Single ? revisionModeSingleContextValue : revisionModeMultipleContextValue);
        return createContextValue(values);
    }

    getTreeItem(): TreeItem {
        return {
            id: this.id,
            label: this.label,
            iconPath: new ThemeIcon('window'),
            contextValue: this.contextValue,
            collapsibleState: TreeItemCollapsibleState.Collapsed,
        }
    }

    async getChildren(): Promise<TreeElementBase[]> {
        return [
            createGenericElement({
                id: `${this.id}/imageName`,
                label: localize('imageName', 'Name:'),
                contextValue: 'containerImageNameItem',
                description: `${this.imageAndTag}`,
            }),
            createGenericElement({
                id: `${this.id}/imageRegistry`,
                label: localize('imageRegistry', 'Registry:'),
                contextValue: 'containerImageRegistryItem',
                description: `${this.loginServer}`,
            })
        ];
    }

    private get parentResource(): ContainerAppModel | Revision {
        return getParentResource(this.containerApp, this.revision);
    }

    protected setProperties(): void {
        this.label = 'Image';
    }

    protected setDraftProperties(): void {
        this.label = 'Image*';
    }

    hasUnsavedChanges(): boolean {
        // We only care about showing changes to descendants of the revision draft item when in multiple revisions mode
        if (this.containerApp.revisionsMode === KnownActiveRevisionsMode.Multiple && !RevisionDraftItem.hasDescendant(this)) {
            return false;
        }

        const currentContainers: Container[] = this.parentResource.template?.containers ?? [];
        const currentContainer: Container = currentContainers[this.containersIdx];

        return this.container.image !== currentContainer.image;
    }
}
