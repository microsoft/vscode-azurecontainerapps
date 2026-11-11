/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type RegistryCredentials, type Secret } from '@azure/arm-appcontainers';

export interface RegistryConfiguration {
    registries: RegistryCredentials[];
    secrets: Secret[];
    // Reused environment identities must not be attached to the app.
    managedIdentityIds?: string[];
}

/**
 * Merge registry credentials and secrets without modifying either input. Updates replace entries with the same
 * server or secret name; unrelated entries are preserved. Keep only explicit identity attachments still used by a registry.
 */
export function mergeRegistryConfiguration(current: Partial<RegistryConfiguration> | undefined, updated: Partial<RegistryConfiguration>): RegistryConfiguration {
    const registriesByServer = new Map<string | undefined, RegistryCredentials>();
    const secretsByName = new Map<string | undefined, Secret>();
    const identityIdsByLowercaseId = new Map<string, string>();

    // Process updates last so Map.set() replaces matching entries while keeping unrelated ones.
    for (const configuration of [current, updated]) {
        for (const credential of configuration?.registries ?? []) {
            const server = credential.server?.toLowerCase();
            registriesByServer.set(server, { ...credential });
        }

        for (const secret of configuration?.secrets ?? []) {
            // Secret names are case-sensitive, unlike server names and identity IDs.
            secretsByName.set(secret.name, { ...secret });
        }

        for (const id of configuration?.managedIdentityIds ?? []) {
            identityIdsByLowercaseId.set(id.toLowerCase(), id);
        }
    }

    const registries = Array.from(registriesByServer.values());
    const managedIdentityIds: string[] = [];
    for (const id of identityIdsByLowercaseId.values()) {
        // A registry edit may have replaced an identity with password authentication or another identity.
        const isUsedByRegistry = registries.some(credential => credential.identity?.toLowerCase() === id.toLowerCase());
        if (isUsedByRegistry) {
            managedIdentityIds.push(id);
        }
    }

    const mergedConfiguration: RegistryConfiguration = {
        registries,
        secrets: Array.from(secretsByName.values()),
    };
    if (managedIdentityIds.length) {
        mergedConfiguration.managedIdentityIds = managedIdentityIds;
    }

    return mergedConfiguration;
}
