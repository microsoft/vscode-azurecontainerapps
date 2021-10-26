/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ThemeIcon } from "vscode";
import { AzExtTreeItem, TreeItemIconPath } from "vscode-azureextensionui";
import { localize } from "../utils/localize";
import { ContainerAppTreeItem } from "./ContainerAppTreeItem";

export class LogsTreeItem extends AzExtTreeItem {
    public static contextValue: string = 'log';
    public readonly contextValue: string = LogsTreeItem.contextValue;
    public readonly parent: ContainerAppTreeItem;

    public label: string;

    constructor(parent: ContainerAppTreeItem) {
        super(parent);
        this.id = `${this.parent.id}/logs`;
        this.label = localize('logs', 'Logs');
        this.commandId = 'containerApps.openLogs';
    }

    public get iconPath(): TreeItemIconPath {
        // TODO: need proper icon
        return new ThemeIcon('book');
    }
}
