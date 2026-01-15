/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode, type Container, type EnvironmentVar, type Revision } from "@azure/arm-appcontainers";
import { type IActionContext } from "@microsoft/vscode-azext-utils";
import { type AzureSubscription } from "@microsoft/vscode-azureresources-api";
import * as deepEqual from "deep-eql";
import { ThemeIcon, type TreeItem } from "vscode";
import { ext } from "../../extensionVariables";
import { localize } from "../../utils/localize";
import { getParentResource } from "../../utils/revisionDraftUtils";
import { type ContainerAppModel } from "../ContainerAppItem";
import { RevisionDraftDescendantBase } from "../revisionManagement/RevisionDraftDescendantBase";
import { RevisionDraftItem } from "../revisionManagement/RevisionDraftItem";

const clickToView: string = localize('clickToView', 'Hidden value. Click to view.');

export class EnvironmentVariableItem extends RevisionDraftDescendantBase {
    static readonly contextValue: string = 'environmentVariableItem';
    static readonly contextValueRegExp: RegExp = new RegExp(EnvironmentVariableItem.contextValue);

    id: string = `${this.parentResource.id}/${this.container.image}/${this.envVariable.name}`;

    private hideValue: boolean = true;
    private hiddenMessage: string; // Shown when 'hideValue' is true
    private hiddenValue: string; // Shown when 'hideValue' is false

    constructor(
        subscription: AzureSubscription,
        containerApp: ContainerAppModel,
        revision: Revision,
        readonly containersIdx: number,

        // Used as the basis for the view; can reflect either the original or the draft changes
        readonly container: Container,
        readonly envVariable: EnvironmentVar,
    ) {
        super(subscription, containerApp, revision);
    }

    getTreeItem(): TreeItem {
        return {
            label: this.label,
            contextValue: EnvironmentVariableItem.contextValue,
            description: this.envVariable.secretRef && !this.hideValue ? localize('secretRef', 'Secret reference') : undefined,
            iconPath: new ThemeIcon('symbol-constant'),
            command: {
                command: 'containerApps.toggleEnvironmentVariableVisibility',
                title: localize('commandtitle', 'Toggle Environment Variable Visibility'),
                arguments: [this, this.hideValue,]
            }
        };
    }

    public async toggleValueVisibility(_: IActionContext): Promise<void> {
        this.hideValue = !this.hideValue;
        ext.branchDataProvider.refresh(this);
    }

    public get label(): string {
        return this.hideValue ? this.hiddenMessage : this.hiddenValue;
    }

    private get envOutput(): string {
        return this.envVariable.value || this.envVariable.secretRef || '';
    }

    private get parentResource(): ContainerAppModel | Revision {
        return getParentResource(this.containerApp, this.revision);
    }

    protected setProperties(): void {
        this.hiddenMessage = `${this.envVariable.name}=${clickToView}`;
        this.hiddenValue = `${this.envVariable.name}=${this.envOutput}`;
    }

    protected setDraftProperties(): void {
        this.hiddenMessage = `${this.envVariable.name}=${clickToView} *`;
        this.hiddenValue = `${this.envVariable.name}=${this.envOutput} *`;
    }

    hasUnsavedChanges(): boolean {
        // We only care about showing changes to descendants of the revision draft item when in multiple revisions mode
        if (this.containerApp.revisionsMode === KnownActiveRevisionsMode.Multiple && !RevisionDraftItem.hasDescendant(this)) {
            return false;
        }

        const currentContainers: Container[] = this.parentResource.template?.containers ?? [];
        const currentContainer: Container | undefined = currentContainers[this.containersIdx];
        const currentEnv: EnvironmentVar | undefined = currentContainer.env?.find(env => env.name === this.envVariable.name);

        return !currentEnv || !deepEqual(this.envVariable, currentEnv);
    }
}
