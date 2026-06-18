/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import { AcaSandboxCli, parseSandboxGroupId, type ProcessResult, type ProcessRunner } from '../../src/sandboxes/AcaSandboxCli';
import { type SandboxGroupRef, type SandboxRef } from '../../src/sandboxes/acaSandboxTypes';

interface RecordedCall {
    file: string;
    args: string[];
}

function makeCli(result: Partial<ProcessResult> | (() => Promise<ProcessResult>), calls: RecordedCall[] = []): AcaSandboxCli {
    const runner: ProcessRunner = async (file: string, args: string[]): Promise<ProcessResult> => {
        calls.push({ file, args });
        if (typeof result === 'function') {
            return result();
        }
        return { stdout: '', stderr: '', exitCode: 0, ...result };
    };
    return new AcaSandboxCli({ runner, acaPath: 'aca', azPath: 'az' });
}

const groupRef: SandboxGroupRef = { subscriptionId: 'sub1', resourceGroup: 'rg1', groupName: 'grp1' };
const sandboxRef: SandboxRef = { ...groupRef, sandboxId: 'sb-uuid' };

suite('AcaSandboxCli', () => {
    test('parseSandboxGroupId parses ARM ids', () => {
        const ref = parseSandboxGroupId('/subscriptions/abc/resourceGroups/myRg/providers/Microsoft.App/sandboxGroups/myGroup');
        assert.deepStrictEqual(ref, { subscriptionId: 'abc', resourceGroup: 'myRg', groupName: 'myGroup' });
    });

    test('parseSandboxGroupId returns undefined for non-matching ids', () => {
        assert.strictEqual(parseSandboxGroupId('/subscriptions/abc/resourceGroups/myRg'), undefined);
    });

    test('listSubscriptions filters to enabled and parses JSON', async () => {
        const calls: RecordedCall[] = [];
        const cli = makeCli({ stdout: JSON.stringify([
            { id: 's1', name: 'Sub One', state: 'Enabled' },
            { id: 's2', name: 'Sub Two', state: 'Disabled' },
            { id: 's3', name: 'Sub Three' },
        ]) }, calls);
        const subs = await cli.listSubscriptions();
        assert.deepStrictEqual(subs.map(s => s.id), ['s1', 's3']);
        assert.deepStrictEqual(calls[0], { file: 'az', args: ['account', 'list', '-o', 'json'] });
    });

    test('listGroups passes subscription and parses array', async () => {
        const calls: RecordedCall[] = [];
        const cli = makeCli({ stdout: JSON.stringify([{ id: '/x', name: 'g' }]) }, calls);
        const groups = await cli.listGroups('sub1');
        assert.strictEqual(groups.length, 1);
        assert.deepStrictEqual(calls[0], { file: 'aca', args: ['sandboxgroup', 'list', '-s', 'sub1', '-o', 'json'] });
    });

    test('listSandboxes builds group args and tolerates empty stdout', async () => {
        const calls: RecordedCall[] = [];
        const cli = makeCli({ stdout: '' }, calls);
        const sandboxes = await cli.listSandboxes(groupRef);
        assert.deepStrictEqual(sandboxes, []);
        assert.deepStrictEqual(calls[0].args, ['sandbox', 'list', '-s', 'sub1', '-g', 'rg1', '--group', 'grp1', '-o', 'json']);
    });

    test('mutations build expected arg arrays', async () => {
        const calls: RecordedCall[] = [];
        const cli = makeCli({}, calls);
        await cli.stop(sandboxRef);
        await cli.resume(sandboxRef);
        await cli.delete(sandboxRef);
        await cli.snapshot(sandboxRef, 'snap1');
        await cli.setAutoSuspend(sandboxRef, { enabled: true, idleTimeoutSeconds: 600, mode: 'Memory' });
        await cli.setAutoSuspend(sandboxRef, { enabled: false });

        const base = ['-s', 'sub1', '-g', 'rg1', '--group', 'grp1', '--id', 'sb-uuid'];
        assert.deepStrictEqual(calls[0].args, ['sandbox', 'stop', ...base]);
        assert.deepStrictEqual(calls[1].args, ['sandbox', 'resume', ...base]);
        assert.deepStrictEqual(calls[2].args, ['sandbox', 'delete', ...base, '--yes']);
        assert.deepStrictEqual(calls[3].args, ['sandbox', 'snapshot', ...base, '--name', 'snap1']);
        assert.deepStrictEqual(calls[4].args, ['sandbox', 'lifecycle', 'set', ...base, '--auto-suspend', 'enable', '--idle-timeout-seconds', '600', '--mode', 'Memory']);
        assert.deepStrictEqual(calls[5].args, ['sandbox', 'lifecycle', 'set', ...base, '--auto-suspend', 'disable']);
    });

    test('maps ENOENT to an actionable aca-not-found error', async () => {
        const cli = makeCli(() => {
            const err = new Error('spawn aca ENOENT') as NodeJS.ErrnoException;
            err.code = 'ENOENT';
            return Promise.reject(err);
        });
        await assert.rejects(() => cli.listGroups('sub1'), /aca.*CLI.*could not be found|aca-cli-install/i);
    });

    test('maps auth failure stderr to an actionable error', async () => {
        const cli = makeCli({ exitCode: 1, stderr: 'Please run az login to setup account.' });
        await assert.rejects(() => cli.listGroups('sub1'), /az login|aca auth login/i);
    });

    test('non-auth failures include exit code and stderr', async () => {
        const cli = makeCli({ exitCode: 3, stderr: 'boom' });
        await assert.rejects(() => cli.listGroups('sub1'), /exit code 3[\s\S]*boom/);
    });

    test('getSandbox throws on non-object JSON', async () => {
        const cli = makeCli({ stdout: '[]' });
        await assert.rejects(() => cli.getSandbox(sandboxRef), /unexpected/i);
    });

    test('listPublicDiskImages builds group args and parses array', async () => {
        const calls: RecordedCall[] = [];
        const cli = makeCli({ stdout: JSON.stringify([{ name: 'ubuntu' }, { name: 'alpine' }]) }, calls);
        const images = await cli.listPublicDiskImages(groupRef);
        assert.deepStrictEqual(images.map(i => i.name), ['ubuntu', 'alpine']);
        assert.deepStrictEqual(calls[0].args, ['sandboxgroup', 'disk', 'list-public', '-s', 'sub1', '-g', 'rg1', '--group', 'grp1', '-o', 'json']);
    });

    test('createSandbox builds args with disk and optional cpu/memory', async () => {
        const calls: RecordedCall[] = [];
        const cli = makeCli({ stdout: JSON.stringify({ id: 'sb-new', state: 'Running' }) }, calls);
        const created = await cli.createSandbox(groupRef, { disk: 'ubuntu', cpu: '1000m', memory: '2048Mi' });
        assert.strictEqual(created?.id, 'sb-new');
        assert.deepStrictEqual(calls[0].args, ['sandbox', 'create', '-s', 'sub1', '-g', 'rg1', '--group', 'grp1', '--disk', 'ubuntu', '--cpu', '1000m', '--memory', '2048Mi', '-o', 'json']);
    });

    test('createSandbox omits cpu/memory when not provided', async () => {
        const calls: RecordedCall[] = [];
        const cli = makeCli({ stdout: '' }, calls);
        const created = await cli.createSandbox(groupRef, { disk: 'ubuntu' });
        assert.strictEqual(created, undefined);
        assert.deepStrictEqual(calls[0].args, ['sandbox', 'create', '-s', 'sub1', '-g', 'rg1', '--group', 'grp1', '--disk', 'ubuntu', '-o', 'json']);
    });

    test('createSandbox tolerates noisy non-JSON output without throwing', async () => {
        const cli = makeCli({ stdout: 'Creating sandbox...\nDone.\n{"id":"sb-noisy","state":"Running"}\n' });
        const created = await cli.createSandbox(groupRef, { disk: 'ubuntu' });
        assert.strictEqual(created?.id, 'sb-noisy');
    });

    test('createSandbox returns undefined when output has no JSON object', async () => {
        const cli = makeCli({ stdout: 'Sandbox created successfully.\n' });
        const created = await cli.createSandbox(groupRef, { disk: 'ubuntu' });
        assert.strictEqual(created, undefined);
    });
});
