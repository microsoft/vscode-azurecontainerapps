/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { localize } from '../../utils/localize';
import { type AcaSandboxCli } from '../AcaSandboxCli';
import { type SandboxGroup, type SandboxGroupRef, type Subscription } from '../acaSandboxTypes';
import { SandboxItem } from './SandboxItem';
import { type SandboxTreeItem } from './SandboxTreeItem';

/** Item representing a sandbox group within a subscription. */
export class SandboxGroupItem implements SandboxTreeItem {
    static readonly contextValue: string = 'sandboxGroupItem';

    constructor(
        public readonly cli: AcaSandboxCli,
        public readonly subscription: Subscription,
        public readonly ref: SandboxGroupRef,
        public readonly group: SandboxGroup,
    ) { }

    getTreeItem(): vscode.TreeItem {
        const treeItem = new vscode.TreeItem(this.group.name, vscode.TreeItemCollapsibleState.Collapsed);
        treeItem.contextValue = SandboxGroupItem.contextValue;
        treeItem.iconPath = new vscode.ThemeIcon('symbol-namespace');
        treeItem.id = `sandboxGroup/${this.group.id}`;

        const descriptionParts: string[] = [];
        if (this.group.location) {
            descriptionParts.push(this.group.location);
        }
        if (this.ref.resourceGroup) {
            descriptionParts.push(this.ref.resourceGroup);
        }
        treeItem.description = descriptionParts.join(' · ');

        treeItem.tooltip = new vscode.MarkdownString(
            localize('sandboxGroupTooltip', '**Sandbox group:** {0}\n\n**Resource group:** {1}\n\n**Location:** {2}\n\n**Provisioning state:** {3}',
                this.group.name,
                this.ref.resourceGroup || '—',
                this.group.location || '—',
                this.group.properties?.provisioningState || '—'));
        return treeItem;
    }

    async getChildren(): Promise<SandboxTreeItem[]> {
        const sandboxes = await this.cli.listSandboxes(this.ref);
        return sandboxes.map(sandbox => new SandboxItem(this.cli, this.subscription, {
            ...this.ref,
            sandboxId: sandbox.id,
        }, sandbox));
    }
}
