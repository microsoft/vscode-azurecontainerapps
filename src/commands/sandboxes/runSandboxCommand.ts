/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type IActionContext } from '@microsoft/vscode-azext-utils';
import * as vscode from 'vscode';
import { ext } from '../../extensionVariables';
import { type AcaSandboxCli } from '../../sandboxes/AcaSandboxCli';
import { type SandboxRef } from '../../sandboxes/acaSandboxTypes';
import { createAcaSandboxCli } from '../../sandboxes/createAcaSandboxCli';
import { pickSandbox } from '../../sandboxes/pickSandbox';
import { type SandboxItem } from '../../sandboxes/tree/SandboxItem';
import { localize } from '../../utils/localize';

/**
 * Prompts for a command to run inside a sandbox via `aca sandbox exec`, then streams the
 * command and its stdout/stderr to the extension output channel. When invoked without a tree
 * node (e.g. from the command palette) the user is walked through a sandbox picker.
 */
export async function runSandboxCommand(context: IActionContext, node?: SandboxItem): Promise<void> {
    let cli: AcaSandboxCli;
    let ref: SandboxRef;
    let label: string;
    if (node) {
        cli = node.cli;
        ref = node.ref;
        label = node.label;
    } else {
        cli = createAcaSandboxCli();
        const picked = await pickSandbox(context, cli);
        ref = picked.ref;
        label = picked.label;
    }

    const command = await context.ui.showInputBox({
        prompt: localize('runCommandPrompt', 'Enter a command to run in the sandbox'),
        placeHolder: 'ls -la',
        validateInput: (value: string): string | undefined => {
            if (!(value ?? '').trim()) {
                return localize('runCommandRequired', 'A command is required.');
            }
            return undefined;
        },
    }).then(value => value.trim());

    const stdout = await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: localize('runningCommand', 'Running command in sandbox "{0}"...', label),
    }, async () => {
        return cli.exec(ref, command);
    });

    ext.outputChannel.appendLine(localize('runCommandHeader', '$ [{0}] {1}', label, command));
    if (stdout) {
        ext.outputChannel.appendLine(stdout.replace(/\s+$/, ''));
    }
    ext.outputChannel.show();
}
