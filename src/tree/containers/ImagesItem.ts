/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { Container } from "@azure/arm-appcontainers";
import { nonNullValue } from "@microsoft/vscode-azext-utils";
import { AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { ThemeIcon, TreeItem } from "vscode";
import { ContainerAppModel } from "../ContainerAppItem";
import { ContainerAppsItem } from "../ContainerAppsBranchDataProvider";


export interface ImagesItem extends ContainerAppsItem {
    image: string;
}

export function createImagesItem(container: Container, subscription: AzureSubscription, containerApp: ContainerAppModel, containerId: string): ImagesItem {
    const id = `${containerId}/image`;
    return {
        id,
        subscription,
        containerApp,
        image: nonNullValue(container.image),
        getTreeItem: (): TreeItem => ({
            id,
            contextValue: 'containerItemImage',
            label: `Image: ${container.image}`,
            iconPath: new ThemeIcon('dash'),
        }),
    }
}
