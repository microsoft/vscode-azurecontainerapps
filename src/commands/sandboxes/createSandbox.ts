/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createSubscriptionContext, subscriptionExperience, type IActionContext, type ISubscriptionContext } from '@microsoft/vscode-azext-utils';
import { type AzureSubscription } from '@microsoft/vscode-azureresources-api';
import * as vscode from 'vscode';
import { ext } from '../../extensionVariables';
import { createSandboxService, type SandboxService } from '../../sandboxes/SandboxService';
import { SandboxGroupResourceItem } from '../../sandboxes/tree/SandboxGroupResourceItem';
import { createSandboxGroupRef, isCreateSandboxCommandInput, sandboxResourceTiers, type CreateSandboxCommandInput, type PublicDiskImage, type SandboxGroupRef, type SandboxResourceTier } from '../../sandboxes/sandboxTypes';
import { localize } from '../../utils/localize';
import { pickSandboxGroup } from '../../utils/pickItem/pickSandbox';
import { recommendedPickDescription } from '../../utils/pickUtils';
import { refreshSandboxesTree, runSandboxActivity } from './sandboxCommandUtils';

type CreateSandboxTarget = SandboxGroupResourceItem | CreateSandboxCommandInput;

/**
 * Creates a new sandbox within the right-clicked sandbox group. Prompts the user to pick a
 * public disk image, creates the sandbox through the data-plane SDK, and refreshes the tree.
 */
export async function createSandbox(context: IActionContext, target?: CreateSandboxTarget): Promise<void> {
    if (target && !SandboxGroupResourceItem.isSandboxGroupResourceItem(target) && !isCreateSandboxCommandInput(target)) {
        target = undefined;
    }

    let subscription: AzureSubscription;
    let ref: SandboxGroupRef;
    if (SandboxGroupResourceItem.isSandboxGroupResourceItem(target)) {
        subscription = target.subscription;
        ref = target.ref;
    } else if (isCreateSandboxCommandInput(target)) {
        ref = createSandboxGroupRef(target);
        subscription = await subscriptionExperience(context, ext.rgApiV2.resources.azureResourceTreeDataProvider, {
            selectBySubscriptionId: ref.subscriptionId,
            showLoadingPrompt: false,
        });
    } else {
        const selectedGroup = await pickSandboxGroup(context);
        subscription = selectedGroup.subscription;
        ref = selectedGroup.ref;
    }

    const subscriptionContext: IActionContext & ISubscriptionContext & { subscription: AzureSubscription } = Object.assign(context, {
        ...createSubscriptionContext(subscription),
        subscription,
    });
    const service = createSandboxService(subscriptionContext, ref);
    const disk = await promptForDiskImage(context, service);
    const resourceTier = await promptForResourceTier(context);

    await runSandboxActivity(
        localize('createSandboxActivity', 'Create sandbox in group "{0}"', ref.groupName),
        localize('creatingSandbox', 'Creating sandbox in group "{0}"...', ref.groupName),
        async () => {
            await service.createSandbox({ disk, resources: resourceTier.resources });
        },
    );

    void vscode.window.showInformationMessage(localize('sandboxCreated', 'Created a new sandbox in group "{0}".', ref.groupName));
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
