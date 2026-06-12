/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { DialogResponses, type IActionContext } from '@microsoft/vscode-azext-utils';
import * as vscode from 'vscode';
import { type SandboxItem } from '../../sandboxes/tree/SandboxItem';
import { localize } from '../../utils/localize';
import { refreshSandboxesTree, requireSandboxItem } from './sandboxCommandUtils';
import { promptForSnapshotName } from './snapshotSandbox';

export async function deleteSandbox(context: IActionContext, node?: SandboxItem): Promise<void> {
    const item = requireSandboxItem(node);

    const deleteMessage = localize('confirmDeleteSandbox', 'Are you sure you want to delete sandbox "{0}"? This cannot be undone.', item.label);
    await context.ui.showWarningMessage(deleteMessage, { modal: true }, DialogResponses.deleteResponse);

    const snapshotFirst = localize('snapshotFirst', 'Snapshot first');
    const skipSnapshot = localize('deleteWithoutSnapshot', 'Delete without snapshot');
    const snapshotChoice = await context.ui.showWarningMessage(
        localize('snapshotBeforeDelete', 'Take a snapshot before deleting "{0}"?', item.label),
        { modal: true },
        { title: snapshotFirst },
        { title: skipSnapshot },
    );

    let snapshotName: string | undefined;
    if (snapshotChoice.title === snapshotFirst) {
        snapshotName = await promptForSnapshotName(context);
    }

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: localize('deletingSandbox', 'Deleting sandbox "{0}"...', item.label),
    }, async () => {
        if (snapshotName) {
            await item.cli.snapshot(item.ref, snapshotName);
        }
        await item.cli.delete(item.ref);
    });

    refreshSandboxesTree();
}
