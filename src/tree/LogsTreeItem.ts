/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzExtParentTreeItem, AzExtTreeItem, GenericTreeItem, TreeItemIconPath } from "@microsoft/vscode-azext-utils";
import { ThemeIcon } from "vscode";
import { localize } from "../utils/localize";
import { ContainerAppTreeItem } from "./ContainerAppTreeItem";

export class LogsTreeItem extends AzExtParentTreeItem {
    public static contextValue: string = 'log';
    public static openLogsContext: string = 'openLog';
    public readonly contextValue: string = LogsTreeItem.contextValue;
    public readonly parent: ContainerAppTreeItem;

    public label: string;
    public childTypeLabel: string = 'log view';

    constructor(parent: ContainerAppTreeItem) {
        super(parent);
        this.id = `${this.parent.id}/logParent`;
        this.label = localize('logs', 'Logs');
    }

    public get iconPath(): TreeItemIconPath {
        return new ThemeIcon('book');
    }

    public async loadMoreChildrenImpl(): Promise<AzExtTreeItem[]> {
        const iconPath = new ThemeIcon('link-external');
        return [
            new GenericTreeItem(this, { label: 'Open Logs', contextValue: 'openLogs', commandId: 'containerApps.openLogsInPortal', iconPath, id: `${this.parent.id}/logs` }),
            new GenericTreeItem(this, { label: 'Open Log Stream', contextValue: 'openLogStream', commandId: 'containerApps.openLogsInPortal', iconPath, id: `${this.parent.id}/logstream` })
        ]
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }
}
