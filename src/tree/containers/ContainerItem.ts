/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import type { Container } from "@azure/arm-appcontainers";
import { AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { TreeItemCollapsibleState } from "vscode";
import { treeUtils } from "../../utils/treeUtils";
import { ContainerAppModel } from "../ContainerAppItem";
import { ContainerAppsItem } from "../ContainerAppsBranchDataProvider";
import { createImagesItem } from "./ImagesItem";

export interface ContainerItem extends ContainerAppsItem {
    container: Container;
}

export function createContainerItem(container: Container, subscription: AzureSubscription, containerApp: ContainerAppModel): ContainerItem {
    const id = `containerItem${container.name}`;
    return {
        id: id,
        subscription,
        containerApp,
        container,
        getTreeItem: () => ({
            id,
            label: container.name,
            iconPath: treeUtils.getIconPath('scaling'), // just a placeholder until we find the containers icon
            contextValue: 'containerItem',
            collapsibleState: TreeItemCollapsibleState.Collapsed,
        }),
        getChildren: async () => {
            {
                return [createImagesItem(container, subscription, containerApp, id)];
            }
        },
    }
}
