/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type IActionContext } from '@microsoft/vscode-azext-utils';
import * as vscode from 'vscode';
import { SandboxItem } from '../../sandboxes/tree/SandboxItem';
import { localize } from '../../utils/localize';
import { pickSandbox } from '../../utils/pickItem/pickSandbox';

export async function copySandboxId(context: IActionContext, node?: SandboxItem): Promise<void> {
    if (node && !SandboxItem.isSandboxItem(node)) {
        node = undefined;
    }
    node ??= await pickSandbox(context);

    await vscode.env.clipboard.writeText(node.ref.sandboxId);
    void vscode.window.showInformationMessage(localize('copiedSandboxId', 'Copied sandbox ID to the clipboard.'));
}
