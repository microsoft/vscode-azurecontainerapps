/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerApp } from "@azure/arm-appservice";
import { AzExtParentTreeItem, AzExtTreeItem, TreeItemIconPath } from "vscode-azureextensionui";
import { getResourceGroupFromId } from "../utils/azureUtils";
import { nonNullProp } from "../utils/nonNull";
import { treeUtils } from "../utils/treeUtils";
import { IAzureResourceTreeItem } from './IAzureResourceTreeItem';

export class ContainerAppTreeItem extends AzExtTreeItem implements IAzureResourceTreeItem {
    public static contextValue: string = 'containerApp';
    public readonly contextValue: string = ContainerAppTreeItem.contextValue;
    public readonly data: ContainerApp;
    public resourceGroupName: string;

    public name: string;
    public label: string;

    constructor(parent: AzExtParentTreeItem, ca: ContainerApp) {
        super(parent);
        this.data = ca;

        this.id = nonNullProp(this.data, 'id');
        this.resourceGroupName = getResourceGroupFromId(this.id);

        this.name = nonNullProp(this.data, 'name');
        this.label = this.name;

    }

    public get iconPath(): TreeItemIconPath {
        return treeUtils.getIconPath('azure-containerapps');
    }

    public async browse(): Promise<void> {
        // TODO: Implement
    }

    // TODO: deleteTreeItemImpl
    // TODO: Configure an image
    // TODO: Container settings
    // TODO: View container logs
    // TODO: KEDA scale
    // TODO: Dapr
}
