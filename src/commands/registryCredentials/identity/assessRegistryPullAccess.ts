/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownManagedServiceIdentityType, type ManagedEnvironment, type ManagedServiceIdentity, type RegistryCredentials } from '@azure/arm-appcontainers';
import { isRestError } from '@azure/core-rest-pipeline';
import { createManagedServiceIdentityClient, parseAzureResourceId } from '@microsoft/vscode-azext-azureutils';
import { nonNullProp } from '@microsoft/vscode-azext-utils';
import { ext } from '../../../extensionVariables';
import { createContainerAppsAPIClient } from '../../../utils/azureClients';
import { localize } from '../../../utils/localize';
import { AcrPullEnableStep } from './AcrPullEnableStep';
import { type ManagedIdentityRegistryCredentialsContext } from './ManagedIdentityRegistryCredentialsContext';

export type RegistryPullAccess =
    | { status: 'configured' | 'available'; identity: string }
    | { status: 'none' };

interface RegistryIdentity {
    reference: string;
    principalId?: string;
}

/**
 * Preserves configured credentials or looks for an identity with AcrPull on the registry or an inherited scope.
 * Standard apps can use app or environment identities; Express apps can only use app-attached UAIDs.
 * This check does not create identities, attach them, or assign roles.
 *
 * - configured: The app's registry credentials already reference an eligible identity. Access is not revalidated.
 * - available: An eligible identity has AcrPull, but the registry credentials must be added or updated to reference it.
 * - none: No reusable configuration or confirmed AcrPull access was found.
 *
 * This is not a complete permissions check - AcrPush, group membership, custom roles, and ACR repository permissions are not evaluated.
 */
export async function assessRegistryPullAccess(context: ManagedIdentityRegistryCredentialsContext, registryCredentials: RegistryCredentials | undefined): Promise<RegistryPullAccess> {
    if (!context.registry?.id) {
        return { status: 'none' };
    }

    const environment = await getManagedEnvironment(context);
    const configuredReference = registryCredentials?.identity;
    // Missing AcrPull does not disprove configured access. Reuse must not require extra role or identity read permissions.
    // Express still requires the configured identity to be an app-attached UAID.
    if (configuredReference && (environment?.environmentMode !== 'Express'
        || Object.keys(context.containerApp?.identity?.userAssignedIdentities ?? {}).some(id => id.toLowerCase() === configuredReference.toLowerCase()))) {
        return { status: 'configured', identity: configuredReference };
    }

    // Prefer app identities, then fall back to standard-app environment identities without checking shared UAIDs twice.
    const containerAppIdentities = getContainerAppIdentities(context.containerApp?.identity, environment?.environmentMode);
    const environmentIdentities = getEnvironmentIdentities(environment).filter(identity => !containerAppIdentities.some(appIdentity => appIdentity.reference.toLowerCase() === identity.reference.toLowerCase()));
    const identities = [...containerAppIdentities, ...environmentIdentities];
    if (!identities.length) {
        return { status: 'none' };
    }

    // Share one paginated role-assignment scan across all candidates.
    const acrPullPrincipalIds = await AcrPullEnableStep.getPrincipalIdsWithRole(context, context.registry.id);
    for (const identity of identities) {
        const principalId = await getIdentityPrincipalId(context, identity);
        if (principalId && acrPullPrincipalIds.has(principalId.toLowerCase())) {
            return { status: 'available', identity: identity.reference };
        }
    }

    return { status: 'none' };
}

async function getManagedEnvironment(context: ManagedIdentityRegistryCredentialsContext): Promise<ManagedEnvironment | undefined> {
    if (context.managedEnvironment) {
        return context.managedEnvironment;
    }

    // Load missing environment details before deciding whether Express identity restrictions apply.
    if (context.containerApp) {
        const parsedId = parseAzureResourceId(context.containerApp.managedEnvironmentId);
        const client = await createContainerAppsAPIClient({ ...context, subscriptionId: parsedId.subscriptionId });
        return client.managedEnvironments.get(parsedId.resourceGroup, parsedId.resourceName);
    }
    return undefined;
}

function getContainerAppIdentities(
    appIdentity: ManagedServiceIdentity | undefined,
    environmentMode: ManagedEnvironment['environmentMode'],
): RegistryIdentity[] {
    const userAssignedIdentities = getUserAssignedIdentities(appIdentity);

    // Express can use app-attached UAIDs, but not the app's system-assigned identity.
    if (environmentMode === 'Express' || !appIdentity?.type?.includes(KnownManagedServiceIdentityType.SystemAssigned)) {
        return userAssignedIdentities;
    }
    return [{ reference: 'system', principalId: nonNullProp(appIdentity, 'principalId') }, ...userAssignedIdentities];
}

function getEnvironmentIdentities(environment: ManagedEnvironment | undefined): RegistryIdentity[] {
    if (environment?.environmentMode === 'Express') {
        return [];
    }

    const identity = environment?.identity;
    const userAssignedIdentities = getUserAssignedIdentities(identity);
    if (!identity?.type?.includes(KnownManagedServiceIdentityType.SystemAssigned)) {
        return userAssignedIdentities;
    }
    return [{ reference: 'system-environment', principalId: nonNullProp(identity, 'principalId') }, ...userAssignedIdentities];
}

function getUserAssignedIdentities(identity: ManagedServiceIdentity | undefined): RegistryIdentity[] {
    const references = Object.keys(identity?.userAssignedIdentities ?? {}).sort();
    return references
        .filter((reference, index) => references.findIndex(other => other.toLowerCase() === reference.toLowerCase()) === index)
        .map(reference => ({ reference }));
}

async function getIdentityPrincipalId(context: ManagedIdentityRegistryCredentialsContext, identity: RegistryIdentity): Promise<string | undefined> {
    if (identity.principalId) {
        return identity.principalId;
    }

    // Resolve the UAID's current principal in its own subscription rather than trusting its attachment.
    const parsedId = parseAzureResourceId(identity.reference);
    const client = await createManagedServiceIdentityClient({ ...context, subscriptionId: parsedId.subscriptionId });
    try {
        return nonNullProp(await client.userAssignedIdentities.get(parsedId.resourceGroup, parsedId.resourceName), 'principalId');
    } catch (error) {
        // Skip denied or deleted candidates; authentication, network, and service failures must still surface.
        if (isRestError(error) && (error.statusCode === 403 || error.statusCode === 404)) {
            ext.outputChannel.appendLog(localize('skipUnavailableRegistryIdentity', 'Skipping unavailable managed identity "{0}" ({1}) while checking registry access.', identity.reference, error.statusCode));
            return undefined;
        }
        throw error;
    }
}
