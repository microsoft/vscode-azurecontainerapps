/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type IActionContext } from '@microsoft/vscode-azext-utils';
import * as vscode from 'vscode';
import { type SandboxItem } from '../../sandboxes/tree/SandboxItem';
import { localize } from '../../utils/localize';
import { refreshSandboxesTree, requireSandboxItem } from './sandboxCommandUtils';

export async function stopSandbox(context: IActionContext, node?: SandboxItem): Promise<void> {
    const item = requireSandboxItem(node);
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: localize('suspendingSandbox', 'Suspending sandbox "{0}"...', item.label),
    }, async () => {
        await item.cli.stop(item.ref);
    });
    void context;
    refreshSandboxesTree();
}

export async function resumeSandbox(context: IActionContext, node?: SandboxItem): Promise<void> {
    const item = requireSandboxItem(node);
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: localize('resumingSandbox', 'Resuming sandbox "{0}"...', item.label),
    }, async () => {
        await item.cli.resume(item.ref);
    });
    void context;
    refreshSandboxesTree();
}
