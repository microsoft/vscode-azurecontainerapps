/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownManagedServiceIdentityType, type ManagedServiceIdentity } from '@azure/arm-appcontainers';

/**
 * Attach a user-assigned identity without removing existing user-assigned or system-assigned identities.
 * Accept only the identity ID because revision drafts store IDs rather than full Azure identity resources.
 *
 * @param managedIdentityId Resource ID of the user-assigned identity to attach, not its clientId or principalId.
 * @param identity The app's existing identity configuration. Its userAssignedIdentities keys are resource IDs
 * of identities already attached to the app; their values may contain clientId and principalId.
 * @returns The existing configuration if no attachment is needed, or a new configuration with the identity added.
 */
export function getContainerAppIdentity(managedIdentityId: string | undefined, identity?: ManagedServiceIdentity): ManagedServiceIdentity | undefined {
    // Azure resource IDs are case-insensitive, so a casing difference must not add a duplicate attachment.
    if (!managedIdentityId || Object.keys(identity?.userAssignedIdentities ?? {}).some(id => id.toLowerCase() === managedIdentityId.toLowerCase())) {
        return identity;
    }

    return {
        ...identity,
        type: identity?.type?.includes(KnownManagedServiceIdentityType.SystemAssigned)
            ? KnownManagedServiceIdentityType.SystemAssignedUserAssigned
            : KnownManagedServiceIdentityType.UserAssigned,
        userAssignedIdentities: {
            ...identity?.userAssignedIdentities,
            [managedIdentityId]: {},
        },
    };
}
