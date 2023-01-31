/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { uiUtils } from "@microsoft/vscode-azext-azureutils";
import { callWithTelemetryAndErrorHandling } from "@microsoft/vscode-azext-utils";
import { AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { TreeItem, TreeItemCollapsibleState } from "vscode";
import { createContainerAppsAPIClient } from "../utils/azureClients";
import { localize } from "../utils/localize";
import { treeUtils } from "../utils/treeUtils";
import { ContainerAppModel } from "./ContainerAppItem";
import { ContainerAppsItem, createSubscriptionContext } from "./ContainerAppsBranchDataProvider";
import { RevisionItem } from "./RevisionItem";

export class RevisionsItem implements ContainerAppsItem {
    id: string;

    constructor(public readonly subscription: AzureSubscription, public readonly containerApp: ContainerAppModel) {
        this.id = `${containerApp.id}/Revisions`;
    }

    async getChildren(): Promise<ContainerAppsItem[]> {
        const result = await callWithTelemetryAndErrorHandling('getChildren', async (context) => {
            const client = await createContainerAppsAPIClient([context, createSubscriptionContext(this.subscription)]);
            const revisions = await uiUtils.listAllIterator(client.containerAppsRevisions.listRevisions(this.containerApp.resourceGroup, this.containerApp.name));
            return revisions.map(revision => new RevisionItem(this.subscription, this.containerApp, revision));
        });

        return result?.reverse() ?? [];
    }

    getTreeItem(): TreeItem {
        return {
            label: localize('revisions', 'Revisions'),
            iconPath: treeUtils.getIconPath('02885-icon-menu-Container-Revision-Active'),
            contextValue: 'revisions',
            collapsibleState: TreeItemCollapsibleState.Collapsed,
        }
    }
}
