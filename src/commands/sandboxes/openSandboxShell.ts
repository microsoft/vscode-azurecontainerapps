/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type IActionContext } from '@microsoft/vscode-azext-utils';
import { type SandboxItem } from '../../sandboxes/tree/SandboxItem';
import { openSandboxTerminal } from '../../sandboxes/sandboxTerminal';
import { requireSandboxItem } from './sandboxCommandUtils';

/**
 * Opens an interactive shell into the selected sandbox by launching `aca sandbox shell` in a
 * VS Code terminal. The CLI auto-resumes a suspended sandbox on connect, so no pre-resume is
 * required here.
 */
export async function openSandboxShell(_context: IActionContext, node?: SandboxItem): Promise<void> {
    const item = requireSandboxItem(node);
    openSandboxTerminal(item.label, item.ref);
}
