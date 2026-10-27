/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createSubscriptionContext, subscriptionExperience, type IActionContext } from '@microsoft/vscode-azext-utils';
import { type AzureSubscription } from '@microsoft/vscode-azureresources-api';
import * as vscode from 'vscode';
import { ext } from '../extensionVariables';
import { createResourceManagementClient } from '../utils/azureClients';
import { localize } from '../utils/localize';
import { createSandboxService, listSandboxGroups } from './SandboxService';
import { type Sandbox, type SandboxRef } from './sandboxTypes';
import { sandboxDisplayLabel } from './sandboxTerminal';

/** A sandbox selected via {@link pickSandbox}. */
export interface PickedSandbox {
    ref: SandboxRef;
    label: string;
    sandbox: Sandbox;
    subscription: AzureSubscription;
}

/**
 * Walks the user through subscription → resource group → sandbox group → sandbox quick picks.
 */
export async function pickSandbox(context: IActionContext): Promise<PickedSandbox> {
    const subscription = await subscriptionExperience(context, ext.rgApiV2.resources.azureResourceTreeDataProvider);
    const clientContext: [IActionContext, ReturnType<typeof createSubscriptionContext>] = [context, createSubscriptionContext(subscription)];

    const resourceClient = await createResourceManagementClient(clientContext);
    const resourceGroups = await collectPaged(resourceClient.resourceGroups.list());
    if (resourceGroups.length === 0) {
        throw new Error(localize('noResourceGroups', 'No resource groups were found in subscription "{0}".', subscription.name));
    }
    const resourceGroup = await pickFrom(context, resourceGroups
        .filter((group): group is typeof group & { name: string } => !!group.name)
        .map(group => ({ label: group.name, description: group.location, data: group.name })),
    localize('selectResourceGroup', 'Select a resource group'));

    const groups = await listSandboxGroups(clientContext, resourceGroup);
    if (groups.length === 0) {
        throw new Error(localize('noSandboxGroupsInResourceGroup', 'No sandbox groups were found in resource group "{0}".', resourceGroup));
    }
    const group = await pickFrom(context, groups.map(g => ({ label: g.name, description: g.location, data: g })),
        localize('selectSandboxGroup', 'Select a sandbox group'));
    const groupRef = {
        subscriptionId: subscription.subscriptionId,
        resourceGroup,
        groupName: group.name,
        region: group.location,
    };

    const service = createSandboxService(clientContext, groupRef);
    const sandboxes = await service.listSandboxes();
    if (sandboxes.length === 0) {
        throw new Error(localize('noSandboxesInGroup', 'No sandboxes were found in group "{0}".', group.name));
    }
    const sandbox = await pickFrom(context, sandboxes.map(s => ({ label: sandboxDisplayLabel(s), description: s.state, data: s })),
        localize('selectSandbox', 'Select a sandbox'));

    return {
        ref: { ...groupRef, sandboxId: sandbox.id },
        label: sandboxDisplayLabel(sandbox),
        sandbox,
        subscription,
    };
}

async function collectPaged<T>(items: AsyncIterable<T>): Promise<T[]> {
    const result: T[] = [];
    for await (const item of items) {
        result.push(item);
    }
    return result;
}

async function pickFrom<T>(context: IActionContext, picks: (vscode.QuickPickItem & { data: T })[], placeHolder: string): Promise<T> {
    const pick = await context.ui.showQuickPick(picks, { placeHolder });
    return pick.data;
}
