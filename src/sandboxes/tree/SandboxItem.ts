/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { localize } from '../../utils/localize';
import { type AcaSandboxCli } from '../AcaSandboxCli';
import { type Sandbox, type SandboxRef, type Subscription } from '../acaSandboxTypes';
import { type SandboxTreeItem } from './SandboxTreeItem';

/** Normalized lifecycle category derived from the open-set `state` string. */
export type SandboxStateCategory = 'running' | 'suspended' | 'transitional' | 'unknown';

export function categorizeSandboxState(state: string | undefined): SandboxStateCategory {
    const normalized = (state ?? '').toLowerCase();
    if (!normalized) {
        return 'unknown';
    }
    if (normalized === 'running' || normalized === 'active') {
        return 'running';
    }
    if (normalized === 'idle' || normalized === 'suspended' || normalized === 'stopped') {
        return 'suspended';
    }
    // Transitional states such as starting/stopping/suspending/resuming/deleting/provisioning.
    if (/(ing|pending|transition)/.test(normalized)) {
        return 'transitional';
    }
    return 'unknown';
}

/** Item representing a single sandbox microVM. */
export class SandboxItem implements SandboxTreeItem {
    static readonly contextValue: string = 'sandboxItem';

    constructor(
        public readonly cli: AcaSandboxCli,
        public readonly subscription: Subscription,
        public readonly ref: SandboxRef,
        public readonly sandbox: Sandbox,
    ) { }

    public get stateCategory(): SandboxStateCategory {
        return categorizeSandboxState(this.sandbox.state);
    }

    public get label(): string {
        const labels = this.sandbox.labels ?? {};
        return labels.name || labels.displayName || shortId(this.sandbox.id);
    }

    getTreeItem(): vscode.TreeItem {
        const treeItem = new vscode.TreeItem(this.label, vscode.TreeItemCollapsibleState.None);
        treeItem.id = `sandbox/${this.sandbox.id}`;
        treeItem.contextValue = `${SandboxItem.contextValue};${this.stateCategory}`;
        treeItem.iconPath = this.iconForState();
        treeItem.description = this.buildDescription();
        treeItem.tooltip = this.buildTooltip();
        return treeItem;
    }

    async getChildren(): Promise<SandboxTreeItem[]> {
        return [];
    }

    private iconForState(): vscode.ThemeIcon {
        switch (this.stateCategory) {
            case 'running':
                return new vscode.ThemeIcon('vm-running', new vscode.ThemeColor('charts.green'));
            case 'suspended':
                return new vscode.ThemeIcon('debug-pause');
            case 'transitional':
                return new vscode.ThemeIcon('loading~spin');
            default:
                return new vscode.ThemeIcon('vm');
        }
    }

    private buildDescription(): string {
        const state = this.sandbox.state || localize('unknownState', 'Unknown');
        const resources = this.sandbox.resources ?? {};
        const cpuMem: string[] = [];
        if (resources.cpu) {
            cpuMem.push(resources.cpu);
        }
        if (resources.memory) {
            cpuMem.push(resources.memory);
        }
        return cpuMem.length ? `${state} · ${cpuMem.join('/')}` : state;
    }

    private buildTooltip(): vscode.MarkdownString {
        const labels = this.sandbox.labels ?? {};
        const labelEntries = Object.entries(labels);
        const autoSuspend = this.sandbox.lifecycle?.autoSuspendPolicy;
        let autoSuspendText: string;
        if (!autoSuspend || autoSuspend.enabled === undefined) {
            autoSuspendText = localize('unknownState', 'Unknown');
        } else if (autoSuspend.enabled) {
            autoSuspendText = localize('autoSuspendEnabled', 'Enabled ({0}s{1})', autoSuspend.interval ?? '?', autoSuspend.mode ? `, ${autoSuspend.mode}` : '');
        } else {
            autoSuspendText = localize('autoSuspendDisabled', 'Disabled');
        }

        const md = new vscode.MarkdownString(undefined, true);
        md.appendMarkdown(localize('sandboxTooltipState', '**State:** {0}\n\n', this.sandbox.state || '—'));
        md.appendMarkdown(localize('sandboxTooltipId', '**ID:** `{0}`\n\n', this.sandbox.id));
        md.appendMarkdown(localize('sandboxTooltipCreated', '**Created:** {0}\n\n', this.sandbox.createdAt || '—'));
        md.appendMarkdown(localize('sandboxTooltipAutoSuspend', '**Auto-suspend:** {0}\n\n', autoSuspendText));
        if (labelEntries.length) {
            md.appendMarkdown(localize('sandboxTooltipLabels', '**Labels:** {0}\n\n', labelEntries.map(([k, v]) => `${k}=${v}`).join(', ')));
        }
        return md;
    }
}

function shortId(id: string): string {
    return id ? id.split('-')[0] : localize('sandbox', 'Sandbox');
}
