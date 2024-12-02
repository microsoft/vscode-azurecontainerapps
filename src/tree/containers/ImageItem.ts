/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode, type Container, type Revision } from "@azure/arm-appcontainers";
import { createGenericElement, nonNullValue, nonNullValueAndProp, type TreeElementBase } from "@microsoft/vscode-azext-utils";
import { type AzureSubscription, type ViewPropertiesModel } from "@microsoft/vscode-azureresources-api";
import { ThemeIcon, TreeItemCollapsibleState, type TreeItem } from "vscode";
import { localize } from "../../utils/localize";
import { getParentResource } from "../../utils/revisionDraftUtils";
import { type ContainerAppModel } from "../ContainerAppItem";
import { RevisionDraftDescendantBase } from "../revisionManagement/RevisionDraftDescendantBase";
import { RevisionDraftItem } from "../revisionManagement/RevisionDraftItem";

export class ImageItem extends RevisionDraftDescendantBase {
    static readonly contextValue: string = 'imageItem';
    static readonly contextValueRegExp: RegExp = new RegExp(ImageItem.contextValue);

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

    id: string = `${this.parentResource.id}/image/${this.container.image}`;
    label: string;

    // Todo: Update to use 'getData' after PR merges adding containerIdx
    viewProperties: ViewPropertiesModel = {
        data: nonNullValueAndProp(this.container, 'image'),
        label: this.container.name ?? '',
    }

    private getImageName(image?: string): string {
        const loginServer: string = this.getLoginServer(image);
        if (!loginServer) return '';

        return image?.substring(nonNullValue(loginServer.length) + 1, image?.length) ?? '';
    }

    private getLoginServer(image?: string): string {
        return image?.split('/')[0] ?? '';
    }

    getTreeItem(): TreeItem {
        return {
            id: this.id,
            label: this.label,
            iconPath: new ThemeIcon('window'),
            contextValue: ImageItem.contextValue,
            collapsibleState: TreeItemCollapsibleState.Collapsed,
        }
    }

    async getChildren(): Promise<TreeElementBase[]> {
        const { imageNameItem: isImageNameUnsaved, imageRegistryItem: isImageRegistryUnsaved } = this.doChildrenHaveUnsavedChanges();

        return [
            createGenericElement({
                id: `${this.id}/imageName`,
                label: isImageNameUnsaved ? localize('imageNameDraft', 'Name*:') : localize('imageName', 'Name:'),
                contextValue: 'containerImageNameItem',
                description: `${this.getImageName(this.container.image)}`,
            }),
            createGenericElement({
                id: `${this.id}/imageRegistry`,
                label: isImageRegistryUnsaved ? localize('imageRegistryDraft', 'Registry*:') : localize('imageRegistry', 'Registry:'),
                contextValue: 'containerImageRegistryItem',
                description: `${this.getLoginServer(this.container.image)}`,
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

    private doChildrenHaveUnsavedChanges(): { imageNameItem: boolean, imageRegistryItem: boolean } {
        // We only care about showing changes to descendants of the revision draft item when in multiple revisions mode
        if (this.containerApp.revisionsMode === KnownActiveRevisionsMode.Multiple && !RevisionDraftItem.hasDescendant(this)) {
            return { imageNameItem: false, imageRegistryItem: false };
        }

        const currentContainers: Container[] = this.parentResource.template?.containers ?? [];
        const currentContainer: Container | undefined = currentContainers[this.containersIdx];

        return {
            imageNameItem: this.getImageName(currentContainer?.image) !== this.getImageName(this.container.image),
            imageRegistryItem: this.getLoginServer(currentContainer?.image) !== this.getLoginServer(this.container.image),
        };
    }

    hasUnsavedChanges(): boolean {
        // We only care about showing changes to descendants of the revision draft item when in multiple revisions mode
        if (this.containerApp.revisionsMode === KnownActiveRevisionsMode.Multiple && !RevisionDraftItem.hasDescendant(this)) {
            return false;
        }

        const currentContainers: Container[] = this.parentResource.template?.containers ?? [];
        const currentContainer: Container | undefined = currentContainers[this.containersIdx];

        return this.container.image !== currentContainer?.image;
    }
}
