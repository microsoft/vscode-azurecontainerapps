/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type ContainerApp, type ManagedEnvironment } from "@azure/arm-appcontainers";
import { getResourceGroupFromId } from '@microsoft/vscode-azext-azureutils';
import { callWithTelemetryAndErrorHandling, createGenericElement, nonNullProp, nonNullValue, type IActionContext } from "@microsoft/vscode-azext-utils";
import { type AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { ThemeIcon, TreeItemCollapsibleState, type TreeItem } from "vscode";
import { createContainerAppsClient } from '../utils/azureClients';
import { createPortalUrl } from "../utils/createPortalUrl";
import { hasLogDestination } from '../utils/hasLogDestination';
import { localize } from "../utils/localize";
import { type TreeElementBase } from "./ContainerAppsBranchDataProvider";

const logStreamItemContextValue: string = 'logStreamItem';
const logsItemContextValue: string = 'logsItem';

export class LogsGroupItem implements TreeElementBase {
    static readonly contextValue: string = 'logsGroupItem';
    static readonly contextValueRegExp: RegExp = new RegExp(LogsGroupItem.contextValue);
    id: string;

    constructor(private readonly subscription: AzureSubscription, private readonly containerApp: ContainerApp) {
        this.id = `${containerApp.id}/Logs`;
    }

    getTreeItem(): TreeItem {
        return {
            collapsibleState: TreeItemCollapsibleState.Collapsed,
            contextValue: LogsGroupItem.contextValue,
            iconPath: new ThemeIcon('book'),
            id: this.id,
            label: localize('logs', 'Logs'),
        };
    }

    async getChildren(): Promise<TreeElementBase[]> {
        const hasDestination = await callWithTelemetryAndErrorHandling('logsGroupItem.getChildren', async context => {
            const environment = await this.getEnvironment(context);
            return hasLogDestination(environment.appLogsConfiguration);
        });
        // Only a confirmed missing destination should offer workspace attachment.
        return this.getLogItems(hasDestination !== false);
    }

    protected async getEnvironment(context: IActionContext): Promise<ManagedEnvironment> {
        const environmentId = nonNullProp(this.containerApp, 'managedEnvironmentId');
        context.valuesToMask.push(this.subscription.subscriptionId, environmentId, nonNullProp(this.containerApp, 'id'));
        const client = await createContainerAppsClient(context, this.subscription);
        return client.managedEnvironments.get(getResourceGroupFromId(environmentId), nonNullValue(environmentId.split('/').pop(), 'environmentName'));
    }

    private getLogItems(hasLogDestination: boolean): TreeElementBase[] {
        const openInPortal = 'azureResourceGroups.openInPortal';
        const startStreamingLogs = 'containerApps.startStreamingLogs';
        return [
            createGenericElement({
                contextValue: logStreamItemContextValue,
                commandId: startStreamingLogs,
                iconPath: new ThemeIcon('play'),
                id: `${this.id}/logstream`,
                label: localize('openLogStream', 'Connect to Log Stream...'),
                commandArgs: [{
                    subscription: this.subscription,
                    containerApp: this.containerApp,
                }]
            }),
            createGenericElement({
                contextValue: logsItemContextValue,
                commandId: hasLogDestination ? openInPortal : 'containerApps.connectLogAnalytics',
                iconPath: new ThemeIcon(hasLogDestination ? 'link-external' : 'plug'),
                id: `${this.containerApp.id}/logs`,
                label: hasLogDestination ? localize('openLogs', 'Open Logs') : localize('connectLogAnalytics', 'Attach Log Analytics Workspace...'),
                commandArgs: [hasLogDestination ? {
                    portalUrl: createPortalUrl(this.subscription, `${this.containerApp.id}/logs`),
                } : {
                    subscription: this.subscription,
                    containerApp: this.containerApp,
                }]
            }),

        ];
    }
}
