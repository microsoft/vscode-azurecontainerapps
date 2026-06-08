/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { getResourceGroupFromId } from '@microsoft/vscode-azext-azureutils';
import { parseError, type IActionContext } from '@microsoft/vscode-azext-utils';
import * as vscode from 'vscode';
import { ext } from '../extensionVariables';
import { ContainerAppItem } from '../tree/ContainerAppItem';
import { ContainerAppResourceItem } from '../tree/ContainerAppResourceItem';
import { localize } from '../utils/localize';

interface MaybeContainerAppRaw {
    properties?: { managedEnvironmentId?: string };
}

/**
 * Navigates from a {@link ContainerAppResourceItem} (under the standalone
 * `AzExtResourceType.ContainerApps` group) to the equivalent app's parent
 * environment under the `AzExtResourceType.ContainerAppsEnvironment` group.
 *
 * The host's `revealAzureResource` walks the tree using a `startsWith` ancestor
 * check on Azure resource ids -- but a container app's ARM id is a *sibling* of
 * its managed environment's id, not a descendant. So host-side reveal can only
 * locate the env in the env-rooted hierarchy. We reveal the env with
 * `expand: true` so the user immediately sees the target app under it.
 */
export async function revealInEnvironment(context: IActionContext, item: ContainerAppResourceItem): Promise<void> {
    if (!ContainerAppResourceItem.isContainerAppResourceItem(item)) {
        return;
    }

    const containerAppId = item.containerAppId;

    // Prefer managedEnvironmentId from the cached raw resource (avoids a network round trip).
    let managedEnvironmentId = (item.resource.raw as MaybeContainerAppRaw | undefined)?.properties?.managedEnvironmentId;
    if (!managedEnvironmentId) {
        const containerApp = await ContainerAppItem.Get(
            context,
            item.subscription,
            getResourceGroupFromId(containerAppId),
            item.resource.name);
        managedEnvironmentId = containerApp.managedEnvironmentId;
    }

    if (!managedEnvironmentId) {
        ext.outputChannel.appendLog(localize('revealInEnvNoEnvId', 'Unable to determine managed environment id for container app "{0}".', item.resource.name));
        return;
    }

    // Make sure the Azure Resources view is showing -- reveal does nothing visible if it isn't.
    try {
        await vscode.commands.executeCommand('azureResourceGroups.focus');
    } catch {
        // Not fatal. Older host versions or alternate views; continue with reveal.
    }

    try {
        await ext.rgApiV2.resources.revealAzureResource(managedEnvironmentId, {
            select: true,
            focus: true,
            expand: true,
        });
    } catch (err) {
        const parsed = parseError(err);
        context.telemetry.properties.revealError = parsed.errorType;
        ext.outputChannel.appendLog(localize('revealInEnvFailed', 'Failed to reveal managed environment "{0}": {1}', managedEnvironmentId, parsed.message));
        throw err;
    }
}
