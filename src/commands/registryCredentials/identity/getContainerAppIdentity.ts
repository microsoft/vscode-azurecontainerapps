/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownManagedServiceIdentityType, type ManagedServiceIdentity } from '@azure/arm-appcontainers';
import { type ManagedIdentityRegistryCredentialsContext } from './ManagedIdentityRegistryCredentialsContext';

export function getContainerAppIdentity(
    context: Pick<ManagedIdentityRegistryCredentialsContext, 'managedIdentity'>,
    identity?: ManagedServiceIdentity,
): ManagedServiceIdentity | undefined {
    const identityId = context.managedIdentity?.id;
    if (!identityId || Object.keys(identity?.userAssignedIdentities ?? {}).some(id => id.toLowerCase() === identityId.toLowerCase())) {
        return identity;
    }

    return {
        ...identity,
        type: identity?.type?.includes(KnownManagedServiceIdentityType.SystemAssigned)
            ? KnownManagedServiceIdentityType.SystemAssignedUserAssigned
            : KnownManagedServiceIdentityType.UserAssigned,
        userAssignedIdentities: {
            ...identity?.userAssignedIdentities,
            [identityId]: {},
        },
    };
}
