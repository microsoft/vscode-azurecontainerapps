/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ExecResult, type LifecyclePolicy, type PublicDiskImage, type Sandbox, type Snapshot } from '@azure/containerapps-sandbox';
import * as assert from 'assert';
import { AzureSandboxService, ensureSandboxRunning, type SandboxServiceClient } from '../../src/sandboxes/SandboxService';

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
});
