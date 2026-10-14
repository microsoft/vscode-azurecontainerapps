/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from "assert";
import { type ContainerApp, KnownActiveRevisionsMode, type Revision } from "@azure/arm-appcontainers";
import { getSecretReferenceLocations } from "../src/commands/secret/deleteSecret/getSecretReferenceLocations";

suite('getSecretReferenceLocations', () => {
    const secretName = 'queue-secret';

    test('single mode referenced secret is discovered', async () => {
        const containerApp = createContainerApp({
            configuration: {
                activeRevisionsMode: KnownActiveRevisionsMode.Single,
                registries: [{ server: 'myacr.azurecr.io', passwordSecretRef: secretName }]
            },
            template: {
                containers: [
                    {
                        name: 'api',
                        env: [{ name: 'QUEUE_CONNECTION', secretRef: secretName }]
                    }
                ],
                scale: {
                    rules: [
                        {
                            name: 'queue-rule',
                            azureQueue: { auth: [{ secretRef: secretName, triggerParameter: 'connection' }] }
                        }
                    ]
                }
            }
        });

        assert.deepStrictEqual(getSecretReferenceLocations(secretName, containerApp), [
            'current template Azure Queue scale rule "queue-rule"',
            'current template container "api" env "QUEUE_CONNECTION"',
            'registry "myacr.azurecr.io" password secret'
        ]);
    });

    test('multiple mode referenced secret is discovered from active revisions', async () => {
        const containerApp = createContainerApp();
        const activeRevisions: Revision[] = [
            {
                name: 'app--000001',
                active: true,
                template: {
                    containers: [
                        {
                            name: 'api',
                            env: [{ name: 'QUEUE_CONNECTION', secretRef: secretName }]
                        }
                    ]
                }
            },
            {
                name: 'app--000000',
                active: false,
                template: {
                    containers: [
                        {
                            name: 'ignored',
                            env: [{ name: 'QUEUE_CONNECTION', secretRef: secretName }]
                        }
                    ]
                }
            }
        ];

        assert.deepStrictEqual(getSecretReferenceLocations(secretName, containerApp, { activeRevisions, includeCurrentTemplate: false }), ['revision "app--000001" container "api" env "QUEUE_CONNECTION"']);
    });

    test('unreferenced secret returns no usages', async () => {
        const containerApp = createContainerApp({
            configuration: {
                activeRevisionsMode: KnownActiveRevisionsMode.Single,
                registries: [{ server: 'myacr.azurecr.io', passwordSecretRef: 'different-secret' }]
            },
            template: {
                scale: {
                    rules: [
                        {
                            name: 'queue-rule',
                            azureQueue: { auth: [{ secretRef: 'different-secret', triggerParameter: 'connection' }] }
                        }
                    ]
                }
            }
        });

        assert.deepStrictEqual(getSecretReferenceLocations(secretName, containerApp), []);
    });
});

function createContainerApp(containerApp: Partial<ContainerApp> = {}): ContainerApp {
    return {
        name: 'test-app',
        id: '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.App/containerApps/test-app',
        managedEnvironmentId: '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.App/managedEnvironments/env',
        location: 'westus2',
        configuration: {
            activeRevisionsMode: KnownActiveRevisionsMode.Single,
            registries: [],
            ...containerApp.configuration
        },
        template: {
            containers: [],
            scale: { rules: [] },
            ...containerApp.template
        },
        ...containerApp
    };
}
