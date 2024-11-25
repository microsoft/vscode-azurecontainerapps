/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode, type Container, type Revision } from "@azure/arm-appcontainers";
import { type TreeElementBase } from "@microsoft/vscode-azext-utils";
import { type AzureSubscription } from "@microsoft/vscode-azureresources-api";
import * as deepEqual from "deep-eql";
import { ThemeIcon, TreeItemCollapsibleState, type TreeItem } from "vscode";
import { localize } from "../../utils/localize";
import { getParentResource } from "../../utils/revisionDraftUtils";
import { type ContainerAppModel } from "../ContainerAppItem";
import { RevisionDraftDescendantBase } from "../revisionManagement/RevisionDraftDescendantBase";
import { RevisionDraftItem } from "../revisionManagement/RevisionDraftItem";
import { EnvironmentVariableItem } from "./EnvironmentVariableItem";

const environmentVariables: string = localize('environmentVariables', 'Environment Variables');

export class EnvironmentVariablesItem extends RevisionDraftDescendantBase {
    static readonly contextValue: string = 'environmentVariablesItem';
    static readonly contextValueRegExp: RegExp = new RegExp(EnvironmentVariablesItem.contextValue);

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

    id: string = `${this.parentResource.id}/environmentVariables/${this.container.image}`;
    label: string;

    getTreeItem(): TreeItem {
        return {
            id: this.id,
            label: this.label,
            iconPath: new ThemeIcon('settings'),
            contextValue: EnvironmentVariablesItem.contextValue,
            collapsibleState: TreeItemCollapsibleState.Collapsed
        }
    }

    getChildren(): TreeElementBase[] {
        return this.container.env?.map(env => RevisionDraftDescendantBase.createTreeItem(EnvironmentVariableItem, this.subscription, this.containerApp, this.revision, this.containersIdx, this.container, env)) ?? [];
    }

    private get parentResource(): ContainerAppModel | Revision {
        return getParentResource(this.containerApp, this.revision);
    }

    protected setProperties(): void {
        this.label = environmentVariables;
    }

    protected setDraftProperties(): void {
        this.label = `${environmentVariables}*`;
    }

    hasUnsavedChanges(): boolean {
        // We only care about showing changes to descendants of the revision draft item when in multiple revisions mode
        if (this.containerApp.revisionsMode === KnownActiveRevisionsMode.Multiple && !RevisionDraftItem.hasDescendant(this)) {
            return false;
        }

        const currentContainers: Container[] = this.parentResource.template?.containers ?? [];
        const currentContainer: Container | undefined = currentContainers[this.containersIdx];

        return !deepEqual(this.container.env ?? [], currentContainer?.env ?? []);
    }
}
