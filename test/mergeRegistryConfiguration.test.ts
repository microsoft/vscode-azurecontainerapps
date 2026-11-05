/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import { mergeRegistryConfiguration, type RegistryConfiguration } from '../src/commands/registryCredentials/mergeRegistryConfiguration';

suite('mergeRegistryConfiguration', () => {
    test('supports missing configuration and omitted arrays', () => {
        assert.deepStrictEqual(mergeRegistryConfiguration(undefined, {}), { registries: [], secrets: [] });

        const registry = { server: 'registry.example', username: 'user', passwordSecretRef: 'password' };
        const secret = { name: 'password', value: 'value' };
        const configuration = { registries: [registry], secrets: [secret] };

        assert.deepStrictEqual(mergeRegistryConfiguration(undefined, configuration), configuration);
        assert.deepStrictEqual(mergeRegistryConfiguration(configuration, {}), configuration);
        assert.deepStrictEqual(mergeRegistryConfiguration({ registries: [registry] }, { secrets: [secret] }), configuration);
    });

    test('preserves unrelated entries and replaces matching registries and secrets', () => {
        const replacedRegistry = { server: 'REGISTRY.example', identity: '/identities/old' };
        const existingRegistry = { server: 'existing.example', passwordSecretRef: 'existing-password' };
        const replacementRegistry = { server: 'registry.example', username: 'new-user', passwordSecretRef: 'password' };
        const addedRegistry = { server: 'added.example', passwordSecretRef: 'added-password' };
        const existingSecret = { name: 'existing-password', value: 'existing-value' };
        const replacementSecret = { name: 'password', value: 'new-value' };
        const addedSecret = { name: 'added-password', value: 'added-value' };
        const differentlyCasedSecret = { name: 'Password', value: 'separate-value' };

        const result = mergeRegistryConfiguration({
            registries: [replacedRegistry, existingRegistry],
            secrets: [{ name: 'password', value: 'old-value' }, existingSecret],
        }, {
            registries: [replacementRegistry, addedRegistry],
            secrets: [replacementSecret, addedSecret, differentlyCasedSecret],
        });

        // Server names overwrite case-insensitively, so replacementRegistry replaces replacedRegistry, leaving three unique registries.
        assert.deepStrictEqual(result, {
            registries: [replacementRegistry, existingRegistry, addedRegistry],
            secrets: [replacementSecret, existingSecret, addedSecret, differentlyCasedSecret],
        });
    });

    test('deduplicates explicit identity attachments case-insensitively without attaching reused identities', () => {
        const currentIdentity = '/identities/EXPLICIT';
        const updatedIdentity = '/identities/explicit';
        const addedIdentity = '/identities/added';
        const reusedIdentity = '/identities/environment';
        const current = {
            registries: [{ server: 'existing.example', identity: currentIdentity }],
            managedIdentityIds: [currentIdentity],
        };
        const updated = {
            registries: [
                { server: 'added.example', identity: addedIdentity },
                { server: 'reused.example', identity: reusedIdentity },
            ],
            managedIdentityIds: [updatedIdentity, addedIdentity, '/identities/unused'],
        };

        assert.deepStrictEqual(mergeRegistryConfiguration(current, updated), {
            registries: [...current.registries, ...updated.registries],
            secrets: [],
            managedIdentityIds: [updatedIdentity, addedIdentity],
        });
    });

    test('drops an explicit identity attachment when its registry switches to password authentication', () => {
        const identity = '/identities/old';
        const replacementRegistry = { server: 'registry.example', username: 'user', passwordSecretRef: 'password' };
        const secret = { name: 'password', value: 'value' };

        assert.deepStrictEqual(mergeRegistryConfiguration({
            registries: [{ server: 'registry.example', identity }],
            managedIdentityIds: [identity],
        }, {
            registries: [replacementRegistry],
            secrets: [secret],
        }), {
            registries: [replacementRegistry],
            secrets: [secret],
        });
    });

    test('does not mutate or share registry and secret entries with either input', () => {
        const current: RegistryConfiguration = {
            registries: [{ server: 'existing.example', username: 'existing-user' }],
            secrets: [{ name: 'existing-password', value: 'existing-value' }],
        };
        const updated: RegistryConfiguration = {
            registries: [{ server: 'added.example', username: 'added-user' }],
            secrets: [{ name: 'added-password', value: 'added-value' }],
        };
        const result = mergeRegistryConfiguration(current, updated);
        for (const registry of result.registries) {
            registry.username = 'changed-user';
        }
        for (const secret of result.secrets) {
            secret.value = 'changed-value';
        }
        result.registries.pop();
        result.secrets.pop();

        assert.deepStrictEqual(current, {
            registries: [{ server: 'existing.example', username: 'existing-user' }],
            secrets: [{ name: 'existing-password', value: 'existing-value' }],
        });
        assert.deepStrictEqual(updated, {
            registries: [{ server: 'added.example', username: 'added-user' }],
            secrets: [{ name: 'added-password', value: 'added-value' }],
        });
    });
});
