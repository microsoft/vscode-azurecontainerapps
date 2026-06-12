/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { localize } from '../../utils/localize';
import { AcaSandboxCli } from '../AcaSandboxCli';
import { createAcaSandboxCli } from '../createAcaSandboxCli';
import { SubscriptionItem } from './SubscriptionItem';
import { type SandboxTreeItem } from './SandboxTreeItem';

/**
 * Tree data provider backing the "Sandboxes" view. Lazily shells out to the `aca`/`az` CLIs
 * via {@link AcaSandboxCli}; never blocks extension activation on network calls.
 */
export class SandboxesTreeDataProvider implements vscode.TreeDataProvider<SandboxTreeItem> {
    private readonly _onDidChangeTreeData = new vscode.EventEmitter<SandboxTreeItem | undefined | void>();
    public readonly onDidChangeTreeData: vscode.Event<SandboxTreeItem | undefined | void> = this._onDidChangeTreeData.event;

    constructor(private cli: AcaSandboxCli = createAcaSandboxCli()) { }

    /** Replaces the underlying CLI client (e.g. when the `acaPath` setting changes). */
    public setCli(cli: AcaSandboxCli): void {
        this.cli = cli;
    }

    /** Refreshes the whole tree, or a single node when provided. */
    public refresh(node?: SandboxTreeItem): void {
        this._onDidChangeTreeData.fire(node);
    }

    getTreeItem(element: SandboxTreeItem): vscode.TreeItem {
        return element.getTreeItem();
    }

    async getChildren(element?: SandboxTreeItem): Promise<SandboxTreeItem[]> {
        if (element) {
            return element.getChildren();
        }

        const subscriptions = await this.cli.listSubscriptions();
        if (subscriptions.length === 0) {
            void vscode.window.showInformationMessage(localize('noEnabledSubscriptions', 'No enabled Azure subscriptions were found. Run "az login" to sign in.'));
            return [];
        }
        return subscriptions.map(subscription => new SubscriptionItem(this.cli, subscription));
    }
}
