/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createSubscriptionContext, nonNullValue, type IActionContext, type ISubscriptionContext } from '@microsoft/vscode-azext-utils';
import { type AzureSubscription } from '@microsoft/vscode-azureresources-api';
import { ext } from '../../extensionVariables';
import { createSandboxService, ensureSandboxRunning } from '../../sandboxes/SandboxService';
import { type ExecResult } from '../../sandboxes/sandboxTypes';
import { SandboxItem } from '../../sandboxes/tree/SandboxItem';
import { localize } from '../../utils/localize';
import { pickSandbox } from '../../utils/pickItem/pickSandbox';
import { refreshSandboxesTree, runSandboxActivity } from './sandboxCommandUtils';

/**
 * Prompts for a command to run inside a sandbox, then writes its result to the output channel.
 */
export async function runSandboxCommand(context: IActionContext, node?: SandboxItem): Promise<void> {
    if (node && !SandboxItem.isSandboxItem(node)) {
        node = undefined;
    }
    node ??= await pickSandbox(context);

    const subscriptionContext: IActionContext & ISubscriptionContext & { subscription: AzureSubscription } = Object.assign(context, {
        ...createSubscriptionContext(node.subscription),
        subscription: node.subscription,
    });
    const service = createSandboxService(subscriptionContext, node.ref);

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
        localize('executeSandboxCommandActivity', 'Execute command in sandbox "{0}"', node.label),
        localize('runningCommand', 'Running command in sandbox "{0}"...', node.label),
        async () => {
            await ensureSandboxRunning(service, node.ref.sandboxId);
            refreshSandboxesTree();
            result = await service.exec(node.ref.sandboxId, command);
        },
    );

    result = nonNullValue(result);
    ext.outputChannel.appendLine(localize('runCommandHeader', '$ [{0}] {1}', node.label, command));
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
