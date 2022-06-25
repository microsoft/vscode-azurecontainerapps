/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzExtParentTreeItem, AzExtTreeItem, callWithTelemetryAndErrorHandling, IActionContext } from "@microsoft/vscode-azext-utils";
import { TreeDataProvider, TreeItem } from "vscode";
import { ContainerAppsExtResourceBase } from "../resolver/ContainerAppsExtResourceBase";
import { createTreeItemsWithErrorHandling } from "../utils/createTreeItemsWithErrorHandling";
import { ContainerAppExtParentTreeItem } from "./ContainerAppExtParentTreeItem";
import { ContainerAppExtTreeItem } from "./ContainerAppExtTreeItem";

export class ContainerAppsBranchDataProvider implements Partial<TreeDataProvider<ContainerAppsExtResourceBase<unknown>>> {
    public getTreeItem(treeItem: ContainerAppsExtResourceBase<unknown>): TreeItem {
        return {
            label: treeItem.label,
            id: treeItem.id,
            iconPath: treeItem.iconPath,
            description: treeItem.description
        }
    }

    // the T should be the ContainerAppsExtResourceBase<unknown>, but that won't work with the current implementation of the resolver because it
    // is expecting AzExtTreeItem from loadMoreChildrenImpl
    public async getChildren(element?: ContainerAppsExtResourceBase<unknown>): Promise<ContainerAppsExtResourceBase<unknown>[] | undefined> {
        return await callWithTelemetryAndErrorHandling('branchGetChildren', async (context: IActionContext) => {
            if (element?.getChildren) {
                return (await element.getChildren(context));
            }

            return [];
        });
    }

    public async createAzExtTreeChildren(resources: ContainerAppsExtResourceBase<unknown>[], parent: AzExtParentTreeItem): Promise<AzExtTreeItem[]> {
        // use resource data to create a tree item for RG extensions (temporarily)
        return await createTreeItemsWithErrorHandling(
            parent,
            resources,
            'invalidContainerAppTreeItemChildren',
            resource => {
                return resource.isParent ?
                    new ContainerAppExtParentTreeItem(parent, resource) :
                    new ContainerAppExtTreeItem(parent, resource);
            },
            resource => resource.label
        ) as AzExtTreeItem[];
    }
}
