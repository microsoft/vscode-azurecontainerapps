/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode, type Container, type Revision } from "@azure/arm-appcontainers";
import { createContextValue, nonNullProp, nonNullValue, type TreeElementBase } from "@microsoft/vscode-azext-utils";
import { type AzureSubscription, type ViewPropertiesModel } from "@microsoft/vscode-azureresources-api";
import { TreeItemCollapsibleState, type TreeItem } from "vscode";
import { revisionDraftFalseContextValue, revisionDraftTrueContextValue, revisionModeMultipleContextValue, revisionModeSingleContextValue } from "../../constants";
import { ext } from "../../extensionVariables";
import { getParentResource } from "../../utils/revisionDraftUtils";
import { type ContainerAppModel } from "../ContainerAppItem";
import { RevisionDraftDescendantBase } from "../revisionManagement/RevisionDraftDescendantBase";
import { EnvironmentVariablesItem } from "./EnvironmentVariablesItem";
import { ImageItem } from "./ImageItem";

export class ContainerItem extends RevisionDraftDescendantBase {
    id: string;
    label: string;

    static readonly contextValue: string = 'containerItem';
    static readonly contextValueRegExp: RegExp = new RegExp(ContainerItem.contextValue);

    constructor(subscription: AzureSubscription, containerApp: ContainerAppModel, revision: Revision, readonly container: Container) {
        super(subscription, containerApp, revision);
        this.id = `${this.parentResource.id}/${container.name}`;
        this.label = nonNullValue(this.container.name);
    }

    getTreeItem(): TreeItem {
        return {
            id: this.id,
            label: `${this.container.name}`,
            contextValue: this.contextValue,
            collapsibleState: TreeItemCollapsibleState.Collapsed,
        }
    }

    getChildren(): TreeElementBase[] {
        return [
            new ImageItem(this.subscription, this.containerApp, this.revision, this.id, this.container),
            new EnvironmentVariablesItem(this.subscription, this.containerApp, this.revision, this.id, this.container)
        ];
    }

    private get parentResource(): ContainerAppModel | Revision {
        return getParentResource(this.containerApp, this.revision);
    }

    private get contextValue(): string {
        const values: string[] = [ContainerItem.contextValue];
        values.push(ext.revisionDraftFileSystem.doesContainerAppsItemHaveRevisionDraft(this) ? revisionDraftTrueContextValue : revisionDraftFalseContextValue);
        values.push(this.containerApp.revisionsMode === KnownActiveRevisionsMode.Single ? revisionModeSingleContextValue : revisionModeMultipleContextValue);
        return createContextValue(values);
    }

    viewProperties: ViewPropertiesModel = {
        data: this.container,
        label: nonNullProp(this.container, 'name'),
    }

    hasUnsavedChanges(): boolean {
        // Needs implementation
        return false;
    }

    protected setProperties(): void {
        // Needs implementation
    }

    protected setDraftProperties(): void {
        // Needs implementation
    }
}

