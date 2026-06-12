/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { type AcaSandboxCli, parseSandboxGroupId } from '../AcaSandboxCli';
import { type Subscription } from '../acaSandboxTypes';
import { SandboxGroupItem } from './SandboxGroupItem';
import { type SandboxTreeItem } from './SandboxTreeItem';

/** Root-level item representing a subscription that may contain sandbox groups. */
export class SubscriptionItem implements SandboxTreeItem {
    static readonly contextValue: string = 'sandboxSubscriptionItem';

    constructor(
        public readonly cli: AcaSandboxCli,
        public readonly subscription: Subscription,
    ) { }

    getTreeItem(): vscode.TreeItem {
        const treeItem = new vscode.TreeItem(this.subscription.name || this.subscription.id, vscode.TreeItemCollapsibleState.Collapsed);
        treeItem.contextValue = SubscriptionItem.contextValue;
        treeItem.iconPath = new vscode.ThemeIcon('azure');
        treeItem.id = `sandboxSubscription/${this.subscription.id}`;
        treeItem.tooltip = this.subscription.id;
        return treeItem;
    }

    async getChildren(): Promise<SandboxTreeItem[]> {
        const groups = await this.cli.listGroups(this.subscription.id);
        return groups.map(group => {
            const ref = parseSandboxGroupId(group.id) ?? {
                subscriptionId: this.subscription.id,
                resourceGroup: '',
                groupName: group.name,
            };
            return new SandboxGroupItem(this.cli, this.subscription, ref, group);
        });
    }
}
