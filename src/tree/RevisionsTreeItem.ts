/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerAppsAPIClient, Revision } from "@azure/arm-app";
import { AzExtParentTreeItem, AzExtTreeItem, IActionContext, TreeItemIconPath, uiUtils } from "vscode-azureextensionui";
import { RevisionConstants } from "../constants";
import { createContainerAppsAPIClient } from "../utils/azureClients";
import { localize } from "../utils/localize";
import { treeUtils } from "../utils/treeUtils";
import { ContainerAppTreeItem } from "./ContainerAppTreeItem";
import { RevisionTreeItem } from "./RevisionTreeItem";

export class RevisionsTreeItem extends AzExtParentTreeItem {
    public static contextValue: string = 'revisions';
    public readonly contextValue: string = RevisionsTreeItem.contextValue;
    public readonly childTypeLabel: string = localize('revision', 'Revision');
    public readonly parent: ContainerAppTreeItem;

    public name: string;
    public label: string;

    constructor(parent: ContainerAppTreeItem) {
        super(parent);
        this.label = localize('revisons', 'Revisions');
    }

    public get iconPath(): TreeItemIconPath {
        // TODO: need proper icon
        return treeUtils.getIconPath('02885-icon-menu-Container-Revision-Active');
    }

    public get description(): string {
        return this.parent.data.configuration?.activeRevisionsMode?.toLowerCase() === 'single' ? RevisionConstants.single.label : RevisionConstants.multiple.label;
    }

    public async loadMoreChildrenImpl(_clearCache: boolean, context: IActionContext): Promise<AzExtTreeItem[]> {
        const client: ContainerAppsAPIClient = await createContainerAppsAPIClient([context, this]);
        const revisions: Revision[] = await uiUtils.listAllIterator(client.containerAppsRevisions.listRevisions(this.parent.resourceGroupName, this.parent.name));

        return await this.createTreeItemsWithErrorHandling(
            revisions,
            'invalidRevision',
            re => new RevisionTreeItem(this, re),
            re => re.name
        );
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }

    public async getRevision(context: IActionContext, name: string): Promise<Revision> {
        const client: ContainerAppsAPIClient = await createContainerAppsAPIClient([context, this]);
        return await client.containerAppsRevisions.getRevision(this.parent.resourceGroupName, this.parent.name, name);
    }
}
