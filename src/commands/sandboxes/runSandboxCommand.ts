/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createSubscriptionContext, nonNullValue, type IActionContext } from '@microsoft/vscode-azext-utils';
import { ext } from '../../extensionVariables';
import { createSandboxService, ensureSandboxRunning, type SandboxService } from '../../sandboxes/SandboxService';
import { type ExecResult, type SandboxRef } from '../../sandboxes/sandboxTypes';
import { pickSandbox } from '../../sandboxes/pickSandbox';
import { type SandboxItem } from '../../sandboxes/tree/SandboxItem';
import { localize } from '../../utils/localize';
import { refreshSandboxesTree, runSandboxActivity } from './sandboxCommandUtils';

/**
 * Prompts for a command to run inside a sandbox, then writes its result to the output channel.
 */
export async function runSandboxCommand(context: IActionContext, node?: SandboxItem): Promise<void> {
    let service: SandboxService;
    let ref: SandboxRef;
    let label: string;
    if (node) {
        ref = node.ref;
        label = node.label;
        service = createSandboxService([context, createSubscriptionContext(node.subscription)], ref);
    } else {
        const picked = await pickSandbox(context);
        ref = picked.ref;
        label = picked.label;
        service = createSandboxService([context, createSubscriptionContext(picked.subscription)], ref);
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

    let result: ExecResult | undefined;
    await runSandboxActivity(
        localize('executeSandboxCommandActivity', 'Execute command in sandbox "{0}"', label),
        localize('runningCommand', 'Running command in sandbox "{0}"...', label),
        async () => {
            await ensureSandboxRunning(service, ref.sandboxId);
            refreshSandboxesTree();
            result = await service.exec(ref.sandboxId, command);
        },
    );

    result = nonNullValue(result);
    ext.outputChannel.appendLine(localize('runCommandHeader', '$ [{0}] {1}', label, command));
    if (result.stdout) {
        ext.outputChannel.appendLine(result.stdout.replace(/\s+$/, ''));
    }
    if (result.stderr) {
        ext.outputChannel.appendLine(result.stderr.replace(/\s+$/, ''));
    }
    if (result.exitCode !== 0) {
        ext.outputChannel.appendLine(localize('runCommandExitCode', 'Command exited with code {0}.', result.exitCode));
    }
    ext.outputChannel.show();
}
