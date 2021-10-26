/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { commands } from 'vscode';
import { AzExtTreeItem, IActionContext, registerCommand, registerErrorHandler, registerReportIssueCommand } from 'vscode-azureextensionui';
import { ext } from '../extensionVariables';
import { SubscriptionTreeItem } from '../tree/SubscriptionTreeItem';
import { browse } from './browse';
import { openInPortal } from './openInPortal';
import { viewProperties } from './viewProperties';

export function registerCommands(): void {

    registerCommand('containerApps.loadMore', async (context: IActionContext, node: AzExtTreeItem) => await ext.tree.loadMore(node, context));
    registerCommand('containerApps.openInPortal', openInPortal);
    registerCommand('containerApps.refresh', async (context: IActionContext, node?: AzExtTreeItem) => await ext.tree.refresh(context, node));
    registerCommand('containerApps.selectSubscriptions', () => commands.executeCommand('azure-account.selectSubscriptions'));
    registerCommand('containerApps.viewProperties', viewProperties);
    registerCommand('containerApps.browse', browse);
    // TODO: Remove, this is just for testing
    registerCommand('containerApps.createApp', async (context: IActionContext, node?: SubscriptionTreeItem) => {
        if (!node) {
            node = await ext.tree.showTreeItemPicker<SubscriptionTreeItem>(SubscriptionTreeItem.contextValue, context);
        }

        await node.createChild(context);
    });

    // Suppress "Report an Issue" button for all errors in favor of the command
    registerErrorHandler(c => c.errorHandling.suppressReportIssue = true);
    registerReportIssueCommand('containerApps.reportIssue');
}
