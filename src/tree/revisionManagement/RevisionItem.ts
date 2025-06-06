/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode, KnownRevisionProvisioningState, type Revision } from "@azure/arm-appcontainers";
import { createContextValue, nonNullProp } from "@microsoft/vscode-azext-utils";
import { type AzureSubscription, type ViewPropertiesModel } from "@microsoft/vscode-azureresources-api";
import { ThemeColor, ThemeIcon, TreeItemCollapsibleState, type IconPath, type TreeItem } from "vscode";
import { revisionDraftFalseContextValue, revisionDraftTrueContextValue } from "../../constants";
import { ext } from "../../extensionVariables";
import { localize } from "../../utils/localize";
import { type ContainerAppModel } from "../ContainerAppItem";
import { type ContainerAppsItem, type TreeElementBase } from "../ContainerAppsBranchDataProvider";
import { ContainersItem } from "../containers/ContainersItem";
import { ScaleItem } from "../scaling/ScaleItem";
import { RevisionDraftDescendantBase } from "./RevisionDraftDescendantBase";

export interface RevisionsItemModel extends ContainerAppsItem {
    revision: Revision;
}

const revisionStateActiveContextValue: string = 'revisionState:active';
const revisionStateInactiveContextValue: string = 'revisionState:inactive';

export class RevisionItem implements RevisionsItemModel {
    static readonly contextValue: string = 'revisionItem';
    static readonly contextValueRegExp: RegExp = new RegExp(RevisionItem.contextValue);

    id: string;
    revisionsMode: KnownActiveRevisionsMode;

    constructor(readonly subscription: AzureSubscription, readonly containerApp: ContainerAppModel, readonly revision: Revision) {
        this.id = nonNullProp(this.revision, 'id');
        this.revisionsMode = containerApp.revisionsMode;
    }

    private get contextValue(): string {
        const values: string[] = [RevisionItem.contextValue];

        // Enable more granular tree item filtering by revision name
        values.push(nonNullProp(this.revision, 'name'));

        values.push(ext.revisionDraftFileSystem.doesContainerAppsItemHaveRevisionDraft(this) ? revisionDraftTrueContextValue : revisionDraftFalseContextValue);
        values.push(this.revision.active ? revisionStateActiveContextValue : revisionStateInactiveContextValue);

        return createContextValue(values);
    }

    private get description(): string | undefined {
        if (this.revisionsMode === KnownActiveRevisionsMode.Single) {
            return undefined;
        }

        if (!this.revision.active) {
            return localize('inactive', 'Inactive');
        } else if (this.revision.name === this.containerApp.latestRevisionName) {
            return localize('latest', 'Latest');
        } else {
            return localize('active', 'Active');
        }
    }

    viewProperties: ViewPropertiesModel = {
        data: this.revision,
        label: nonNullProp(this.revision, 'name'),
    };

    static getTemplateChildren(subscription: AzureSubscription, containerApp: ContainerAppModel, revision: Revision): TreeElementBase[] {
        return [
            RevisionDraftDescendantBase.createTreeItem(ContainersItem, subscription, containerApp, revision),
            RevisionDraftDescendantBase.createTreeItem(ScaleItem, subscription, containerApp, revision)
        ];
    }

    getChildren(): TreeElementBase[] {
        return RevisionItem.getTemplateChildren(this.subscription, this.containerApp, this.revision);
    }

    getTreeItem(): TreeItem {
        return {
            id: this.id,
            label: this.revisionsMode === KnownActiveRevisionsMode.Single ? 'Latest' : this.revision.name,
            iconPath: this.iconPath,
            description: this.description,
            contextValue: this.contextValue,
            collapsibleState: TreeItemCollapsibleState.Collapsed,
        };
    }

    private get iconPath(): IconPath {
        let id: string;
        let colorId: string;

        if (!this.revision.active) {
            id = 'circle-slash';
            colorId = 'testing.iconUnset';
        } else {
            switch (this.revision.provisioningState) {
                case KnownRevisionProvisioningState.Deprovisioning:
                case KnownRevisionProvisioningState.Provisioning:
                    id = 'play-circle';
                    colorId = 'testing.iconUnset';
                    break;
                case KnownRevisionProvisioningState.Failed:
                    id = 'error';
                    colorId = 'testing.iconFailed';
                    break;
                case KnownRevisionProvisioningState.Provisioned:
                    id = 'pass'
                    colorId = 'testing.iconPassed';
                    break;
                case KnownRevisionProvisioningState.Deprovisioned:
                default:
                    id = 'circle-slash';
                    colorId = 'testing.iconUnset';
            }
        }

        return new ThemeIcon(id, colorId ? new ThemeColor(colorId) : undefined);
    }

    static isRevisionItem(item: unknown): item is RevisionItem {
        return typeof item === 'object' &&
            typeof (item as RevisionItem).contextValue === 'string' &&
            RevisionItem.contextValueRegExp.test((item as RevisionItem).contextValue);
    }
}
