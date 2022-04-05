/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Ingress } from "@azure/arm-app";
import { AzExtParentTreeItem, AzExtTreeItem, GenericTreeItem, IActionContext, TreeItemIconPath } from "@microsoft/vscode-azext-utils";
import { ThemeIcon } from "vscode";
import { azResourceContextValue, IngressConstants } from "../constants";
import { localize } from "../utils/localize";
import { treeUtils } from "../utils/treeUtils";
import { ContainerAppTreeItem } from "./ContainerAppTreeItem";
import { IAzureResourceTreeItem } from "./IAzureResourceTreeItem";

const label: string = localize('ingress', 'Ingress');

export class IngressTreeItem extends AzExtParentTreeItem implements IAzureResourceTreeItem {
    public static contextValue: string = 'ingress|enabled';
    public readonly contextValue: string = `${IngressTreeItem.contextValue}|${azResourceContextValue}`;
    public readonly parent: ContainerAppTreeItem;
    public data: Ingress

    public label: string;

    constructor(parent: ContainerAppTreeItem, data?: Ingress) {
        super(parent);
        this.data = data || {};
        this.label = label;
    }

    public async loadMoreChildrenImpl(_clearCache: boolean, _context: IActionContext): Promise<AzExtTreeItem[]> {
        const label: string = this.data.external ? IngressConstants.external : IngressConstants.internal;
        const description: string = this.data.external ? IngressConstants.externalDesc : IngressConstants.internalDesc;

        return [
            new GenericTreeItem(this, { label: localize('targetPort', 'Target Port'), contextValue: 'targetPort', description: String(this.data.targetPort), iconPath: new ThemeIcon('dash') }),
            new GenericTreeItem(this, { label, contextValue: 'visibility', description, iconPath: new ThemeIcon('dash') })
        ];
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }

    public get iconPath(): TreeItemIconPath {
        return treeUtils.getIconPath('10061-icon-Virtual Networks-Networking');
    }
}

export class IngressDisabledTreeItem extends AzExtTreeItem {
    public static contextValue: string = 'ingress|disabled';
    public readonly contextValue: string = IngressDisabledTreeItem.contextValue;
    public readonly parent: ContainerAppTreeItem;

    public label: string;

    constructor(parent: ContainerAppTreeItem) {
        super(parent);
        this.label = label;
        this.description = localize('disabled', 'Disabled');
    }

    public get iconPath(): TreeItemIconPath {
        // TODO: need proper icon
        return new ThemeIcon('debug-disconnect');
    }
}
