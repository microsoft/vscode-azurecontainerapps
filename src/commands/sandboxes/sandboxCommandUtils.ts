/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ext } from '../../extensionVariables';
import { type SandboxItem } from '../../sandboxes/tree/SandboxItem';
import { type SandboxGroupResourceItem } from '../../sandboxes/tree/SandboxGroupResourceItem';
import { localize } from '../../utils/localize';

/**
 * Resolves the {@link SandboxItem} a command should act on. The per-sandbox commands are only
 * surfaced from the tree's context menu (hidden from the command palette), so the node is
 * expected to be supplied by VS Code.
 */
export function requireSandboxItem(node: SandboxItem | undefined): SandboxItem {
    if (!node) {
        throw new Error(localize('selectSandbox', 'Select a sandbox in the Azure Resources view to run this command.'));
    }
    return node;
}

/**
 * Resolves the {@link SandboxGroupResourceItem} a group-level command should act on. Group
 * commands are only surfaced from the group's context menu, so the node is supplied by VS Code.
 */
export function requireSandboxGroupItem(node: SandboxGroupResourceItem | undefined): SandboxGroupResourceItem {
    if (!node) {
        throw new Error(localize('selectSandboxGroup', 'Select a sandbox group in the Azure Resources view to run this command.'));
    }
    return node;
}

/** Refreshes the sandbox group branch in the Azure Resources view after a mutation. */
export function refreshSandboxesTree(): void {
    ext.sandboxGroupBranchDataProvider?.refresh();
}
