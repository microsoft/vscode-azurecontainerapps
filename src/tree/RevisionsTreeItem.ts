/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Revision, WebSiteManagementClient } from "@azure/arm-appservice";
import { AzExtParentTreeItem, AzExtTreeItem, IActionContext, TreeItemIconPath } from "vscode-azureextensionui";
import { createWebSiteClient } from "../utils/azureClients";
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
        return treeUtils.getIconPath('azure-containerapps');
    }

    public async loadMoreChildrenImpl(_clearCache: boolean, context: IActionContext): Promise<AzExtTreeItem[]> {
        const client: WebSiteManagementClient = await createWebSiteClient([context, this]);
        const revisions: Revision[] = [];

        for await (const re of client.containerAppsRevisions.listRevisions(this.parent.resourceGroupName, this.parent.name)) {
            revisions.push(re);
        }

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
}
