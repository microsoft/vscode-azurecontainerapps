/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type IActionContext } from '@microsoft/vscode-azext-utils';
import * as vscode from 'vscode';
import { localize } from '../utils/localize';
import { type AcaSandboxCli, parseSandboxGroupId } from './AcaSandboxCli';
import { type Sandbox, type SandboxRef, type Subscription } from './acaSandboxTypes';
import { sandboxDisplayLabel } from './sandboxTerminal';

/** A sandbox selected via {@link pickSandbox}. */
export interface PickedSandbox {
    ref: SandboxRef;
    label: string;
    sandbox: Sandbox;
    subscription: Subscription;
}

/**
 * Walks the user through subscription → group → sandbox quick picks to select a single
 * sandbox. Used when a command is invoked without a tree node (e.g. the command palette or
 * the terminal profile provider). Throws an actionable error when a level has no items.
 */
export async function pickSandbox(context: IActionContext, cli: AcaSandboxCli): Promise<PickedSandbox> {
    const subscriptions = await cli.listSubscriptions();
    if (subscriptions.length === 0) {
        throw new Error(localize('noEnabledSubscriptions', 'No enabled Azure subscriptions were found. Run "az login" to sign in.'));
    }
    const subscription = await pickFrom(context, subscriptions.map(s => ({ label: s.name || s.id, description: s.id, data: s })),
        localize('selectSubscription', 'Select a subscription'));

    const groups = await cli.listGroups(subscription.id);
    if (groups.length === 0) {
        throw new Error(localize('noSandboxGroups', 'No sandbox groups were found in subscription "{0}".', subscription.name || subscription.id));
    }
    const group = await pickFrom(context, groups.map(g => ({ label: g.name, description: g.location, data: g })),
        localize('selectSandboxGroup', 'Select a sandbox group'));
    const groupRef = parseSandboxGroupId(group.id) ?? { subscriptionId: subscription.id, resourceGroup: '', groupName: group.name };

    const sandboxes = await cli.listSandboxes(groupRef);
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

async function pickFrom<T>(context: IActionContext, picks: (vscode.QuickPickItem & { data: T })[], placeHolder: string): Promise<T> {
    const pick = await context.ui.showQuickPick(picks, { placeHolder });
    return pick.data;
}
