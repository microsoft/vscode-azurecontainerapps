/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode, KnownRevisionProvisioningState, Revision } from "@azure/arm-appcontainers";
import { TreeItemIconPath, createContextValue, nonNullProp } from "@microsoft/vscode-azext-utils";
import type { AzureSubscription, ViewPropertiesModel } from "@microsoft/vscode-azureresources-api";
import { ThemeColor, ThemeIcon, TreeItem, TreeItemCollapsibleState } from "vscode";
import { revisionModeMultipleContextValue, revisionModeSingleContextValue } from "../../constants";
import { localize } from "../../utils/localize";
import { treeUtils } from "../../utils/treeUtils";
import type { ContainerAppModel } from "../ContainerAppItem";
import type { ContainerAppsItem, TreeElementBase } from "../ContainerAppsBranchDataProvider";
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

        values.push(this.revision.active ? revisionStateActiveContextValue : revisionStateInactiveContextValue);
        values.push(this.revisionsMode === KnownActiveRevisionsMode.Single ? revisionModeSingleContextValue : revisionModeMultipleContextValue);
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
            RevisionDraftDescendantBase.create(subscription, containerApp, revision, ScaleItem)
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

    private get iconPath(): TreeItemIconPath {
        if (this.revisionsMode === KnownActiveRevisionsMode.Single) {
            return treeUtils.getIconPath('active-revision');
        }

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
}
