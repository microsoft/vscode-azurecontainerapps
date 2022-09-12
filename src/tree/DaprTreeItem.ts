/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Dapr } from "@azure/arm-appcontainers";
import { AzExtParentTreeItem, AzExtTreeItem, GenericTreeItem, IActionContext, TreeItemIconPath } from "@microsoft/vscode-azext-utils";
import { ThemeIcon } from "vscode";
import { azResourceContextValue } from "../constants";
import { localize } from "../utils/localize";
import { treeUtils } from "../utils/treeUtils";
import { ContainerAppTreeItem } from "./ContainerAppTreeItem";
import { IAzureResourceTreeItem } from "./IAzureResourceTreeItem";

export class DaprEnabledTreeItem extends AzExtParentTreeItem implements IAzureResourceTreeItem {
    public static contextValue: string = 'dapr|enabled';
    public readonly contextValue: string = `${DaprEnabledTreeItem.contextValue}|${azResourceContextValue}`;
    public readonly parent: ContainerAppTreeItem;
    public data: Dapr;

    public label: string;

    constructor(parent: ContainerAppTreeItem, data: Dapr | undefined) {
        super(parent);
        this.label = localize('dapr', 'Dapr');
        this.data = data || {};
        this.description = localize('enabled', 'Enabled');
    }

    public get iconPath(): TreeItemIconPath {
        return treeUtils.getIconPath('dapr_logo');
    }

    public async loadMoreChildrenImpl(_clearCache: boolean, _context: IActionContext): Promise<AzExtTreeItem[]> {
        const children: AzExtTreeItem[] = [];
        this.data.appId ? children.push(new GenericTreeItem(this, { description: 'app id', label: this.data.appId, contextValue: 'daprAppId', iconPath: new ThemeIcon('dash') })) : undefined;
        this.data.appPort ? children.push(new GenericTreeItem(this, { description: 'app port', label: String(this.data.appPort), contextValue: 'daprAppPort', iconPath: new ThemeIcon('dash') })) : undefined;
        this.data.appProtocol ? children.push(new GenericTreeItem(this, { description: 'app protocol', label: String(this.data.appProtocol), contextValue: 'daprAppProtocol', iconPath: new ThemeIcon('dash') })) : undefined;

        return children;
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }
}

export class DaprDisabledTreeItem extends AzExtTreeItem {
    public static contextValue: string = 'dapr|disabled';
    public readonly contextValue: string = DaprDisabledTreeItem.contextValue;
    public readonly parent: ContainerAppTreeItem;

    public label: string;

    constructor(parent: ContainerAppTreeItem) {
        super(parent);
        this.label = localize('dapr', 'Dapr');
        this.description = localize('disabled', 'Disabled');
    }

    public get iconPath(): TreeItemIconPath {
        return new ThemeIcon('debug-disconnect');
    }
}
