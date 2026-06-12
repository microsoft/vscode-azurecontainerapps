/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type IActionContext } from '@microsoft/vscode-azext-utils';
import * as vscode from 'vscode';
import { type SandboxItem } from '../../sandboxes/tree/SandboxItem';
import { localize } from '../../utils/localize';
import { refreshSandboxesTree, requireSandboxItem } from './sandboxCommandUtils';

export async function setAutoSuspend(context: IActionContext, node?: SandboxItem): Promise<void> {
    const item = requireSandboxItem(node);

    const picks: (vscode.QuickPickItem & { seconds?: number; disable?: boolean })[] = [
        { label: localize('autoSuspend5m', '5 minutes'), seconds: 300 },
        { label: localize('autoSuspend15m', '15 minutes'), seconds: 900 },
        { label: localize('autoSuspend30m', '30 minutes'), seconds: 1800 },
        { label: localize('autoSuspend1h', '1 hour'), seconds: 3600 },
        { label: localize('autoSuspendCustom', 'Custom...'), seconds: undefined },
        { label: localize('autoSuspendDisablePick', 'Disable auto-suspend'), disable: true },
    ];

    const pick = await context.ui.showQuickPick(picks, {
        placeHolder: localize('autoSuspendPlaceholder', 'Select an idle timeout before the sandbox is auto-suspended'),
    });

    let policy: { enabled: boolean; idleTimeoutSeconds?: number };
    if (pick.disable) {
        policy = { enabled: false };
    } else {
        let seconds = pick.seconds;
        if (seconds === undefined) {
            const input = await context.ui.showInputBox({
                prompt: localize('autoSuspendCustomPrompt', 'Enter the idle timeout in seconds'),
                validateInput: (value: string): string | undefined => {
                    const n = Number((value ?? '').trim());
                    if (!Number.isInteger(n) || n <= 0) {
                        return localize('autoSuspendInvalid', 'Enter a positive whole number of seconds.');
                    }
                    return undefined;
                },
            });
            seconds = Number(input.trim());
        }
        policy = { enabled: true, idleTimeoutSeconds: seconds };
    }

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: localize('updatingAutoSuspend', 'Updating auto-suspend for sandbox "{0}"...', item.label),
    }, async () => {
        await item.cli.setAutoSuspend(item.ref, policy);
    });

    refreshSandboxesTree();
}
