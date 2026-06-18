/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type IActionContext } from '@microsoft/vscode-azext-utils';
import * as vscode from 'vscode';
import { type PublicDiskImage } from '../../sandboxes/acaSandboxTypes';
import { type AcaSandboxCli } from '../../sandboxes/AcaSandboxCli';
import { type SandboxGroupResourceItem } from '../../sandboxes/tree/SandboxGroupResourceItem';
import { type SandboxGroupRef } from '../../sandboxes/acaSandboxTypes';
import { localize } from '../../utils/localize';
import { refreshSandboxesTree, requireSandboxGroupItem } from './sandboxCommandUtils';

/**
 * Creates a new sandbox within the right-clicked sandbox group. Prompts the user to pick a
 * public disk image (falling back to a free-text entry when the image list is unavailable),
 * then runs `aca sandbox create` and refreshes the Azure Resources tree.
 */
export async function createSandbox(context: IActionContext, node?: SandboxGroupResourceItem): Promise<void> {
    const item = requireSandboxGroupItem(node);
    const disk = await promptForDiskImage(context, item.cli, item.ref);

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: localize('creatingSandbox', 'Creating sandbox in group "{0}"...', item.ref.groupName),
    }, async () => {
        await item.cli.createSandbox(item.ref, { disk });
    });

    void vscode.window.showInformationMessage(localize('sandboxCreated', 'Created a new sandbox in group "{0}".', item.ref.groupName));
    refreshSandboxesTree();
}

/**
 * Lets the user choose a public disk image for the new sandbox. When the image list can't be
 * loaded (e.g. older CLI, no public images, or a transient failure), falls back to prompting
 * for an image name directly so the command still works.
 */
async function promptForDiskImage(context: IActionContext, cli: AcaSandboxCli, group: SandboxGroupRef): Promise<string> {
    let images: PublicDiskImage[] = [];
    try {
        images = await cli.listPublicDiskImages(group);
    } catch {
        images = [];
    }

    const picks = images
        .map(image => ({ image, name: image.name || image.displayName }))
        .filter((entry): entry is { image: PublicDiskImage; name: string } => !!entry.name)
        .map(entry => ({
            label: entry.name,
            description: entry.image.displayName && entry.image.displayName !== entry.name ? entry.image.displayName : undefined,
            detail: entry.image.description,
            data: entry.name,
        }));

    if (picks.length === 0) {
        return promptForDiskImageName(context);
    }

    const customEntry = { label: localize('enterImageName', '$(pencil) Enter image name...'), data: undefined };
    const pick = await context.ui.showQuickPick([...picks, customEntry], {
        placeHolder: localize('selectDiskImage', 'Select a disk image for the new sandbox'),
    });
    return pick.data ?? promptForDiskImageName(context);
}

/** Prompts for a disk image name as free text and validates it is non-empty. */
async function promptForDiskImageName(context: IActionContext): Promise<string> {
    return context.ui.showInputBox({
        prompt: localize('diskImagePrompt', 'Enter the public disk image name (for example: ubuntu)'),
        validateInput: (value: string): string | undefined => {
            if (!(value ?? '').trim()) {
                return localize('diskImageRequired', 'A disk image name is required.');
            }
            return undefined;
        },
    }).then(value => value.trim());
}
