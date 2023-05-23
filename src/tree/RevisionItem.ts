/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode, KnownRevisionProvisioningState, Revision } from "@azure/arm-appcontainers";
import { TreeItemIconPath, createContextValue, nonNullProp } from "@microsoft/vscode-azext-utils";
import { AzureSubscription, ViewPropertiesModel } from "@microsoft/vscode-azureresources-api";
import { ThemeColor, ThemeIcon, TreeItem, TreeItemCollapsibleState } from "vscode";
import { localize } from "../utils/localize";
import { treeUtils } from "../utils/treeUtils";
import { ContainerAppModel } from "./ContainerAppItem";
import { ContainerAppsItem, TreeElementBase } from "./ContainerAppsBranchDataProvider";
import { ScaleItem } from "./scaling/ScaleItem";

export interface RevisionsItemModel extends ContainerAppsItem {
    revision: Revision;
}

export class RevisionItem implements RevisionsItemModel {
    id: string;
    revisionsMode: KnownActiveRevisionsMode;

    constructor(public readonly subscription: AzureSubscription, public readonly containerApp: ContainerAppModel, public readonly revision: Revision) {
        this.id = nonNullProp(this.revision, 'id');
        this.revisionsMode = containerApp.revisionsMode;
    }

    viewProperties: ViewPropertiesModel = {
        data: this.revision,
        label: nonNullProp(this.revision, 'name'),
    }

    async getChildren(): Promise<TreeElementBase[]> {
        return [new ScaleItem(this.subscription, this.containerApp, this.revision)];
    }

    getTreeItem(): TreeItem {
        const description = this.revisionsMode === KnownActiveRevisionsMode.Multiple ?
            !this.revision.active ?
                localize('inactive', 'Inactive') :
                this.revision.name === this.containerApp.latestRevisionName ?
                    localize('latest', 'Latest') :
                    undefined :
            // no description for single revision mode
            undefined;

        return {
            id: this.id,
            label: this.revision.name,
            iconPath: this.iconPath,
            description,
            contextValue: createContextValue([`${this.revision.active ? 'active' : 'inactive'}`, 'revision']),
            collapsibleState: TreeItemCollapsibleState.Collapsed,
        }
    }

    private get iconPath(): TreeItemIconPath {
        if (this.revisionsMode === KnownActiveRevisionsMode.Single) {
            return treeUtils.getIconPath('02885-icon-menu-Container-Revision-Active');
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
