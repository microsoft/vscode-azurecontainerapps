/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Dapr } from "@azure/arm-app";
import { AzExtParentTreeItem, AzExtTreeItem, GenericTreeItem, IActionContext, TreeItemIconPath } from "@microsoft/vscode-azext-utils";
import { azResourceContextValue } from "../constants";
import { localize } from "../utils/localize";
import { treeUtils } from "../utils/treeUtils";
import { ContainerAppTreeItem } from "./ContainerAppTreeItem";
import { IAzureResourceTreeItem } from "./IAzureResourceTreeItem";

// https://github.com/microsoft/vscode-azurecontainerapps/issues/55
export class DaprTreeItem extends AzExtParentTreeItem implements IAzureResourceTreeItem {
    public static contextValue: string = 'dapr';
    public readonly contextValue: string = `${DaprTreeItem.contextValue}|${azResourceContextValue}`;
    public readonly parent: ContainerAppTreeItem;
    public data: Dapr;

    public label: string;

    constructor(parent: ContainerAppTreeItem, data: Dapr | undefined) {
        super(parent);
        this.label = localize('dapr', 'Dapr');
        this.data = data || {};
        this.description = this.data.enabled ? 'Enabled' : 'Disabled';
    }

    public get iconPath(): TreeItemIconPath {
        return treeUtils.getIconPath('dapr_logo');
    }

    public async loadMoreChildrenImpl(_clearCache: boolean, _context: IActionContext): Promise<AzExtTreeItem[]> {
        const children: AzExtTreeItem[] = [];
        this.data.appId ? children.push(new GenericTreeItem(this, { description: 'app id', label: this.data.appId, contextValue: 'daprAppId' })) : undefined;
        this.data.appPort ? children.push(new GenericTreeItem(this, { description: 'app port', label: String(this.data.appPort), contextValue: 'daprAppPort' })) : undefined;
        this.data.appProtocol ? children.push(new GenericTreeItem(this, { description: 'app protocol', label: String(this.data.appProtocol), contextValue: 'daprAppProtocol' })) : undefined;

        return children;
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }
}
