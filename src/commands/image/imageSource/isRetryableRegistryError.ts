/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { RegistryCredentialType } from '../../registryCredentials/RegistryCredentialsAddConfigurationListStep';

export function isRetryableRegistryError(error: Error, credentialType: RegistryCredentialType | undefined): boolean {
    return (credentialType === RegistryCredentialType.DockerLogin && /authentication\srequired/i.test(error.message))
        || /failed to resolve registry '[^']+': lookup .+: no such host/i.test(error.message);
}
