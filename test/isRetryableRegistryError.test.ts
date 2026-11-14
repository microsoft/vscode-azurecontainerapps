/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import { isRetryableRegistryError } from '../src/commands/image/imageSource/isRetryableRegistryError';
import { RegistryCredentialType } from '../src/commands/registryCredentials/RegistryCredentialsAddConfigurationListStep';

suite('isRetryableRegistryError', () => {
    const credentialTypes = [...Object.values(RegistryCredentialType), undefined];

    test('retries registry DNS propagation failures regardless of authentication method', () => {
        const error = new Error('The long-running operation has failed. ContainerAppOperationError. Failed to provision revision. '
            + 'Failed to resolve registry \'example.azurecr.io\': lookup example.azurecr.io on 10.0.0.1:53: no such host');

        for (const credentialType of credentialTypes) {
            assert.strictEqual(isRetryableRegistryError(error, credentialType), true);
        }
    });

    test('preserves authentication retries only for Docker login', () => {
        const error = new Error('UNAUTHORIZED: authentication required');

        for (const credentialType of credentialTypes) {
            assert.strictEqual(isRetryableRegistryError(error, credentialType), credentialType === RegistryCredentialType.DockerLogin);
        }
    });

    test('does not retry unrelated DNS failures or permanent image errors', () => {
        const messages = [
            'lookup management.azure.com on 10.0.0.1:53: no such host',
            'failed to resolve registry \'example.azurecr.io\': access denied',
            'MANIFEST_UNKNOWN: manifest tagged latest is not found',
            'The container image name is invalid',
        ];

        for (const message of messages) {
            for (const credentialType of credentialTypes) {
                assert.strictEqual(isRetryableRegistryError(new Error(message), credentialType), false);
            }
        }
    });
});
