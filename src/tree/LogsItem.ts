/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ContainerApp } from "@azure/arm-appcontainers";
import { createGenericElement } from "@microsoft/vscode-azext-utils";
import { AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { ThemeIcon, TreeItem, TreeItemCollapsibleState } from "vscode";
import { createPortalUrl } from "../utils/createPortalUrl";
import { localize } from "../utils/localize";
import { TreeElementBase } from "./ContainerAppsBranchDataProvider";

export class LogsItem implements TreeElementBase {
    constructor(private readonly subscription: AzureSubscription, private readonly containerApp: ContainerApp) { }
    id: string = `${this.containerApp.id}/Logs`;

    getTreeItem(): TreeItem {
        return {
            collapsibleState: TreeItemCollapsibleState.Collapsed,
            contextValue: 'logs',
            iconPath: new ThemeIcon('book'),
            id: this.id,
            label: localize('logs', 'Logs'),
        };
    }

    async getChildren(): Promise<TreeElementBase[]> {
        const openInPortal = 'azureResourceGroups.openInPortal';
        const startStreamingLogs = 'containerApps.startStreamingLogs';
        return [
            createGenericElement({
                contextValue: 'openLogs',
                commandId: openInPortal,
                iconPath: new ThemeIcon('link-external'),
                id: `${this.containerApp.id}/logs`,
                label: localize('openLogs', 'Open Logs'),
                commandArgs: [{
                    portalUrl: createPortalUrl(this.subscription, `${this.containerApp.id}/logs`),
                }]
            }),
            createGenericElement({
                contextValue: 'startStreamingLogs',
                commandId: startStreamingLogs,
                iconPath: new ThemeIcon('play'),
                id: `${this.id}/logstream`,
                label: localize('openLogStream', 'Connect to Log Stream...'),
                commandArgs: [{
                    subscription: this.subscription,
                    containerApp: this.containerApp,
                }]
            }),
        ];
    }
}
