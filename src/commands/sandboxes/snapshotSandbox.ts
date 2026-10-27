/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createSubscriptionContext, type IActionContext } from '@microsoft/vscode-azext-utils';
import * as vscode from 'vscode';
import { createSandboxService } from '../../sandboxes/SandboxService';
import { type SandboxItem } from '../../sandboxes/tree/SandboxItem';
import { localize } from '../../utils/localize';
import { refreshSandboxesTree, requireSandboxItem, runSandboxActivity } from './sandboxCommandUtils';

/** Prompts for a snapshot name and validates it. Returns the trimmed name. */
export async function promptForSnapshotName(context: IActionContext): Promise<string> {
    return context.ui.showInputBox({
        prompt: localize('snapshotNamePrompt', 'Enter a name for the snapshot'),
        validateInput: (value: string): string | undefined => {
            const trimmed = (value ?? '').trim();
            if (!trimmed) {
                return localize('snapshotNameRequired', 'A snapshot name is required.');
            }
            if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,62}$/.test(trimmed)) {
                return localize('snapshotNameInvalid', 'Use 1-63 letters, numbers, ".", "_" or "-", starting with a letter or number.');
            }
            return undefined;
        },
    }).then(value => value.trim());
}

export async function snapshotSandbox(context: IActionContext, node?: SandboxItem): Promise<void> {
    const item = requireSandboxItem(node);
    const service = createSandboxService([context, createSubscriptionContext(item.subscription)], item.ref);
    const snapshotName = await promptForSnapshotName(context);

    await runSandboxActivity(
        localize('createSandboxSnapshotActivity', 'Create snapshot "{0}" of sandbox "{1}"', snapshotName, item.label),
        localize('snapshottingSandbox', 'Creating snapshot "{0}" of sandbox "{1}"...', snapshotName, item.label),
        async () => {
            await service.createSnapshot(item.ref.sandboxId, snapshotName);
        },
    );

    void vscode.window.showInformationMessage(localize('snapshotCreated', 'Created snapshot "{0}" of sandbox "{1}".', snapshotName, item.label));
    refreshSandboxesTree();
}
