/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Container } from "@azure/arm-appcontainers";
import { AzExtParentTreeItem, AzExtTreeItem, GenericTreeItem, TreeItemIconPath } from "@microsoft/vscode-azext-utils";
import { ThemeIcon } from "vscode";
import { ResolvedContainerAppResource } from "../resolver/ResolvedContainerAppResource";
import { localize } from "../utils/localize";

export class LogsTreeItem extends AzExtParentTreeItem {
    public static contextValue: string = 'log';
    public readonly contextValue: string = LogsTreeItem.contextValue;
    public readonly parent: AzExtParentTreeItem & ResolvedContainerAppResource<Container>;

    public label: string;

    constructor(parent: AzExtParentTreeItem) {
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
            new GenericTreeItem(this, { label: 'Open Logs', contextValue: 'openLogs', commandId: 'containerApps.openInPortal', iconPath, id: `${this.parent.id}/logs` }),
            new GenericTreeItem(this, { label: 'Open Log Stream', contextValue: 'openLogStream', commandId: 'containerApps.openInPortal', iconPath, id: `${this.parent.id}/logstream` })
        ]
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }
}
