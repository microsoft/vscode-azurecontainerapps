/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createSubscriptionContext, type IActionContext } from '@microsoft/vscode-azext-utils';
import * as vscode from 'vscode';
import { createSandboxService, type SandboxService } from '../../sandboxes/SandboxService';
import { type SandboxGroupResourceItem } from '../../sandboxes/tree/SandboxGroupResourceItem';
import { sandboxResourceTiers, type PublicDiskImage, type SandboxResourceTier } from '../../sandboxes/sandboxTypes';
import { localize } from '../../utils/localize';
import { recommendedPickDescription } from '../../utils/pickUtils';
import { refreshSandboxesTree, requireSandboxGroupItem, runSandboxActivity } from './sandboxCommandUtils';

/**
 * Creates a new sandbox within the right-clicked sandbox group. Prompts the user to pick a
 * public disk image, creates the sandbox through the data-plane SDK, and refreshes the tree.
 */
export async function createSandbox(context: IActionContext, node?: SandboxGroupResourceItem): Promise<void> {
    const item = requireSandboxGroupItem(node);
    const service = createSandboxService([context, createSubscriptionContext(item.subscription)], item.ref);
    const disk = await promptForDiskImage(context, service);
    const resourceTier = await promptForResourceTier(context);

    await runSandboxActivity(
        localize('createSandboxActivity', 'Create sandbox in group "{0}"', item.ref.groupName),
        localize('creatingSandbox', 'Creating sandbox in group "{0}"...', item.ref.groupName),
        async () => {
            await service.createSandbox({ disk, resources: resourceTier.resources });
        },
    );

    void vscode.window.showInformationMessage(localize('sandboxCreated', 'Created a new sandbox in group "{0}".', item.ref.groupName));
    refreshSandboxesTree();
}

/** Lets the user choose one of the resource tiers supported by the sandbox service. */
async function promptForResourceTier(context: IActionContext): Promise<SandboxResourceTier> {
    const picks = sandboxResourceTiers.map(tier => ({
        label: tier.name,
        description: tier.name === 'M' ? recommendedPickDescription : undefined,
        detail: localize(
            'resourceTierDetails',
            '{0} CPU cores, {1} GB memory, {2} GiB disk',
            tier.cpuCores,
            tier.memoryGb,
            tier.diskGib,
        ),
        data: tier,
        suppressPersistence: true,
    }));

    return (await context.ui.showQuickPick(picks, {
        placeHolder: localize('selectResourceTier', 'Select a resource tier for the new sandbox'),
    })).data;
}

/**
 * Lets the user choose a public disk image for the new sandbox.
 */
async function promptForDiskImage(context: IActionContext, service: SandboxService): Promise<string> {
    const images: PublicDiskImage[] = await service.listPublicDiskImages();

    const picks = images
        .map(image => ({
            label: image.name,
            detail: image.description,
            data: image.name,
        }));

    return (await context.ui.showQuickPick(picks, {
        placeHolder: localize('selectDiskImage', 'Select a disk image for the new sandbox'),
        noPicksMessage: localize('noPublicDiskImages', 'No public disk images are available.'),
    })).data;
}
