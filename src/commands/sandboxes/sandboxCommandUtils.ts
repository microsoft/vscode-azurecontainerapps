/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ext } from '../../extensionVariables';
import { type SandboxItem } from '../../sandboxes/tree/SandboxItem';
import { localize } from '../../utils/localize';

/**
 * Resolves the {@link SandboxItem} a command should act on. The per-sandbox commands are only
 * surfaced from the tree's context menu (hidden from the command palette), so the node is
 * expected to be supplied by VS Code.
 */
export function requireSandboxItem(node: SandboxItem | undefined): SandboxItem {
    if (!node) {
        throw new Error(localize('selectSandbox', 'Select a sandbox in the Sandboxes view to run this command.'));
    }
    return node;
}

/** Refreshes the sandboxes tree after a mutation. */
export function refreshSandboxesTree(): void {
    ext.sandboxesTreeDataProvider?.refresh();
}
