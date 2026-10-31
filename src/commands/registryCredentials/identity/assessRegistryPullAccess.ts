/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownManagedServiceIdentityType, type ManagedEnvironment, type ManagedServiceIdentity, type RegistryCredentials } from '@azure/arm-appcontainers';
import { isRestError } from '@azure/core-rest-pipeline';
import { createManagedServiceIdentityClient, parseAzureResourceId } from '@microsoft/vscode-azext-azureutils';
import { nonNullProp } from '@microsoft/vscode-azext-utils';
import { createContainerAppsAPIClient } from '../../../utils/azureClients';
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
 * Looks for an identity with the AcrPull role on the registry or an inherited scope.
 * Standard apps can use app or environment identities; Express apps can only use app-attached UAIDs.
 * This check does not create identities, attach them, or assign roles.
 *
 * - configured: The app's registry credentials already reference an eligible identity with AcrPull. No change is needed.
 * - available: An eligible identity has AcrPull, but the registry credentials must be added or updated to reference it.
 * - none: No eligible identity with AcrPull was found, so the caller should offer UAID creation or selection.
 *
 * This is not a complete permissions check - group membership, custom roles, and ACR repository permissions are not evaluated.
 */
export async function assessRegistryPullAccess(context: ManagedIdentityRegistryCredentialsContext, registryCredentials: RegistryCredentials | undefined): Promise<RegistryPullAccess> {
    if (!context.registry?.id) {
        return { status: 'none' };
    }

    const environment = await getManagedEnvironment(context);
    const containerAppIdentities = getContainerAppIdentities(context.containerApp?.identity, environment?.environmentMode);
    const environmentIdentities = getEnvironmentIdentities(environment).filter(identity => !containerAppIdentities.some(appIdentity => appIdentity.reference.toLowerCase() === identity.reference.toLowerCase()));
    const configuredReference = registryCredentials?.identity?.toLowerCase();

    // 1. Keep the configured identity if it is still eligible and has AcrPull.
    const configuredIdentity = await findIdentityWithAcrPull(context, [...containerAppIdentities, ...environmentIdentities].filter(identity => identity.reference.toLowerCase() === configuredReference));
    if (configuredIdentity) {
        return { status: 'configured', identity: configuredIdentity.reference };
    }

    // 2. Try other identities attached directly to the app.
    const appIdentity = await findIdentityWithAcrPull(context, containerAppIdentities.filter(identity => identity.reference.toLowerCase() !== configuredReference));
    if (appIdentity) {
        return { status: 'available', identity: appIdentity.reference };
    }

    // 3. Fall back to environment identities, which are eligible only for standard apps.
    const environmentIdentity = await findIdentityWithAcrPull(context, environmentIdentities.filter(identity => identity.reference.toLowerCase() !== configuredReference));
    if (environmentIdentity) {
        return { status: 'available', identity: environmentIdentity.reference };
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

async function findIdentityWithAcrPull(context: ManagedIdentityRegistryCredentialsContext, identities: RegistryIdentity[]): Promise<RegistryIdentity | undefined> {
    for (const identity of identities) {
        const principalId = await getIdentityPrincipalId(context, identity);
        if (principalId && await AcrPullEnableStep.hasRole(context, context.registry?.id, principalId)) {
            return identity;
        }
    }
    return undefined;
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
        // Skip deleted identities, but propagate other failures instead of incorrectly offering identity creation.
        if (isRestError(error) && error.statusCode === 404) {
            return undefined;
        }
        throw error;
    }
}
