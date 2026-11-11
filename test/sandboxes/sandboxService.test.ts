/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { SandboxGroupClient, type ExecResult, type LifecyclePolicy, type PublicDiskImage, type Sandbox, type Snapshot } from '@azure/containerapps-sandbox';
import { createHttpHeaders } from '@azure/core-rest-pipeline';
import * as assert from 'assert';
import { AzureSandboxService, ensureSandboxRunning, sandboxErrorResponsePolicy, type SandboxServiceClient } from '../../src/sandboxes/SandboxService';

const sandbox: Sandbox = {
    id: 'sandbox-1',
    state: 'Running',
    labels: {},
    ports: [],
    environment: {},
    connections: [],
};

const snapshot: Snapshot = {
    id: 'snapshot-1',
    labels: { name: 'checkpoint' },
};

function asyncItems<T>(items: T[]): AsyncIterable<T> {
    return {
        async *[Symbol.asyncIterator](): AsyncIterator<T> {
            yield* items;
        },
    };
}

function createClient(overrides: Partial<SandboxServiceClient['sandboxes']> = {}): SandboxServiceClient {
    const lifecycle: LifecyclePolicy = { autoSuspend: { enabled: true, interval: 300 } };
    const execResult: ExecResult = { exitCode: 0, stdout: 'ok', stderr: '' };
    return {
        sandboxes: {
            list: () => asyncItems([sandbox]),
            beginCreate: () => ({ pollUntilDone: async () => sandbox }),
            get: async () => sandbox,
            exec: async () => execResult,
            beginDelete: () => ({ pollUntilDone: async () => undefined }),
            beginStop: () => ({ pollUntilDone: async () => ({ ...sandbox, state: 'Stopped' }) }),
            beginResume: () => ({ pollUntilDone: async () => sandbox }),
            beginCreateSnapshot: () => ({ pollUntilDone: async () => snapshot }),
            setLifecyclePolicy: async () => lifecycle,
            ...overrides,
        },
        snapshots: {
            list: () => asyncItems([]),
        },
        diskImages: {
            listPublic: () => asyncItems<PublicDiskImage>([
                { id: 'ubuntu', name: 'ubuntu', description: 'Ubuntu', tags: {} },
            ]),
        },
    };
}

suite('AzureSandboxService', () => {
    test('lists all sandboxes and public disk images', async () => {
        const service = new AzureSandboxService(createClient());
        assert.deepStrictEqual(await service.listSandboxes(), [sandbox]);
        assert.deepStrictEqual((await service.listPublicDiskImages()).map(image => image.name), ['ubuntu']);
    });

    test('creates a sandbox from a public disk image and waits for completion', async () => {
        let request: unknown;
        const service = new AzureSandboxService(createClient({
            beginCreate: body => {
                request = body;
                return { pollUntilDone: async () => sandbox };
            },
        }));

        assert.strictEqual((await service.createSandbox({
            disk: 'ubuntu',
            resources: {
                cpu: '2000m',
                memory: '4096Mi',
                disk: '40960Mi',
            },
        })).id, sandbox.id);
        assert.deepStrictEqual(request, {
            sourcesRef: {
                diskImage: {
                    name: 'ubuntu',
                    isPublic: true,
                },
            },
            resources: {
                cpu: '2000m',
                memory: '4096Mi',
                disk: '40960Mi',
            },
        });
    });

    test('maps exec requests and returns stdout, stderr, and exit code', async () => {
        let request: { sandboxId: string; command: string; workingDirectory?: string } | undefined;
        const service = new AzureSandboxService(createClient({
            exec: async (sandboxId, body) => {
                request = { sandboxId, ...body };
                return { exitCode: 7, stdout: 'out', stderr: 'err' };
            },
        }));

        const result = await service.exec('sandbox-1', 'pwd', '/workspace');
        assert.deepStrictEqual(request, { sandboxId: 'sandbox-1', command: 'pwd', workingDirectory: '/workspace' });
        assert.deepStrictEqual(result, { exitCode: 7, stdout: 'out', stderr: 'err' });
    });

    test('waits for stop, resume, snapshot, and delete operations', async () => {
        const completed: string[] = [];
        const service = new AzureSandboxService(createClient({
            beginStop: () => ({ pollUntilDone: async () => {
                completed.push('stop');
                return { ...sandbox, state: 'Stopped' };
            } }),
            beginResume: () => ({ pollUntilDone: async () => {
                completed.push('resume');
                return sandbox;
            } }),
            beginCreateSnapshot: () => ({ pollUntilDone: async () => {
                completed.push('snapshot');
                return snapshot;
            } }),
            beginDelete: () => ({ pollUntilDone: async () => {
                completed.push('delete');
            } }),
        }));

        await service.stopSandbox('sandbox-1');
        await service.resumeSandbox('sandbox-1');
        await service.createSnapshot('sandbox-1', 'checkpoint');
        await service.deleteSandbox('sandbox-1');
        assert.deepStrictEqual(completed, ['stop', 'resume', 'snapshot', 'delete']);
    });

    test('rejects a duplicate snapshot name for the same sandbox before creation', async () => {
        let created = false;
        const client = createClient({
            beginCreateSnapshot: () => {
                created = true;
                return { pollUntilDone: async () => snapshot };
            },
        });
        client.snapshots.list = () => asyncItems([
            { ...snapshot, sandboxId: 'sandbox-1', labels: { name: 'checkpoint' } },
        ]);
        const service = new AzureSandboxService(client);

        await assert.rejects(
            () => service.createSnapshot('sandbox-1', 'checkpoint'),
            /already exists[\s\S]*different name/,
        );
        assert.strictEqual(created, false);
    });

    test('resumes stopped sandboxes before command execution', async () => {
        let resumed = false;
        const service = new AzureSandboxService(createClient({
            get: async () => ({ ...sandbox, state: 'Stopped' }),
            beginResume: () => ({ pollUntilDone: async () => {
                resumed = true;
                return sandbox;
            } }),
        }));

        await ensureSandboxRunning(service, 'sandbox-1');
        assert.strictEqual(resumed, true);
    });

    test('provides actionable RBAC errors', async () => {
        const service = new AzureSandboxService(createClient({
            get: async () => {
                throw { statusCode: 403, requestId: 'request-1' };
            },
        }), 'group-1');

        await assert.rejects(
            () => service.getSandbox('sandbox-1'),
            /SandboxGroup Data Owner[\s\S]*group-1[\s\S]*request-1/,
        );
    });

    const diskSizeMessage = 'Sandbox disk size (5120 MiB) is smaller than disk image minimum size (6162 MiB). Requested disk must be >= the disk image size.';

    for (const { format, body } of [
        { format: 'Azure error', body: { error: { code: 'BadRequest', message: diskSizeMessage } } },
        { format: 'problem details', body: { title: 'Bad Request', status: 400, detail: diskSizeMessage, errorCode: 'BadRequest' } },
    ]) {
        for (const contentType of ['application/json', 'text/plain']) {
            test(`surfaces HTTP 400 disk validation errors through the SDK (${format}, ${contentType})`, async () => {
                const client = new SandboxGroupClient(
                    { getToken: async () => ({ token: 'test-token', expiresOnTimestamp: Date.now() + 60_000 }) },
                    'https://sandbox.example.com',
                    'subscription-1',
                    'resource-group-1',
                    'group-1',
                    {
                        additionalPolicies: [{ policy: sandboxErrorResponsePolicy, position: 'perCall' }],
                        httpClient: {
                            sendRequest: async request => {
                                const headers = createHttpHeaders();
                                headers.set('content-type', contentType);
                                return {
                                    request,
                                    status: 400,
                                    headers,
                                    bodyAsText: JSON.stringify(body),
                                };
                            },
                        },
                    },
                );
                const service = new AzureSandboxService(client);

                await assert.rejects(
                    () => service.createSandbox({
                        disk: 'azure-dev',
                        resources: { cpu: '250m', memory: '512Mi', disk: '5120Mi' },
                    }),
                    (error: Error) => {
                        assert.strictEqual(error.message, diskSizeMessage);
                        assert.ok(error.cause instanceof Error);
                        return true;
                    },
                );
            });
        }
    }

    for (const { name, payload } of [
        { name: 'SDK details', payload: { details: { error: { message: diskSizeMessage } } } },
        { name: 'nested parsed body', payload: { response: { parsedBody: { error: { message: diskSizeMessage } } } } },
        { name: 'top-level parsed body', payload: { response: { parsedBody: { message: diskSizeMessage } } } },
    ]) {
        test(`preserves structured validation messages from ${name}`, async () => {
            const original = Object.assign(new Error('Unexpected status code: 400'), { statusCode: 400, requestId: 'request-1' }, payload);
            const service = new AzureSandboxService(createClient({
                beginCreate: () => ({ pollUntilDone: async () => { throw original; } }),
            }));

            await assert.rejects(
                () => service.createSandbox({ disk: 'azure-dev', resources: { cpu: '250m', memory: '512Mi', disk: '5120Mi' } }),
                (error: Error) => {
                    assert.strictEqual(error.message, `${diskSizeMessage}\n\nRequest ID: request-1`);
                    assert.strictEqual(error.cause, original);
                    return true;
                },
            );
        });
    }

    test('retains not-found guidance and adds service details', async () => {
        const service = new AzureSandboxService(createClient({
            get: async () => {
                throw { statusCode: 404, details: { error: { message: 'Sandbox no longer exists.' } } };
            },
        }));

        await assert.rejects(
            () => service.getSandbox('sandbox-1'),
            /could not be found[\s\S]*Details: Sandbox no longer exists\./,
        );
    });

    for (const bodyAsText of ['<html>Bad Request</html>', '', '{"error":{}}']) {
        test(`preserves the original error for an uninformative body (${bodyAsText})`, async () => {
            const original = Object.assign(new Error('Unexpected status code: 400'), {
                statusCode: 400,
                response: { bodyAsText },
            });
            const service = new AzureSandboxService(createClient({
                get: async () => { throw original; },
            }));

            await assert.rejects(() => service.getSandbox('sandbox-1'), error => error === original);
        });
    }
});
