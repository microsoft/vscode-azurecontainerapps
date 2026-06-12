/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import { chmodSync, mkdtempSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import * as path from 'path';
import { augmentedPath, resolveExecutable } from '../../src/sandboxes/cliPath';

const isWindows = process.platform === 'win32';

suite('cliPath', () => {
    let originalPath: string | undefined;

    setup(() => {
        originalPath = process.env.PATH;
    });

    teardown(() => {
        process.env.PATH = originalPath;
    });

    test('augmentedPath preserves existing entries and adds common CLI dirs', () => {
        process.env.PATH = isWindows ? 'C:\\custom\\bin' : '/custom/bin';
        const dirs = augmentedPath().split(isWindows ? ';' : ':');
        assert.ok(dirs.includes(isWindows ? 'C:\\custom\\bin' : '/custom/bin'), 'existing entry retained');
        assert.strictEqual(dirs[0], isWindows ? 'C:\\custom\\bin' : '/custom/bin', 'existing entries kept first');
        if (!isWindows) {
            assert.ok(dirs.includes('/opt/homebrew/bin'), 'adds Homebrew bin (missed by GUI-launched apps)');
            assert.ok(dirs.includes('/usr/local/bin'), 'adds /usr/local/bin');
        }
    });

    test('augmentedPath does not duplicate entries', () => {
        process.env.PATH = isWindows ? 'C:\\Windows' : '/usr/local/bin';
        const dirs = augmentedPath().split(isWindows ? ';' : ':');
        const target = isWindows ? 'C:\\Windows' : '/usr/local/bin';
        assert.strictEqual(dirs.filter(d => d === target).length, 1, 'no duplicate entries');
    });

    test('resolveExecutable returns an absolute path for a binary on PATH', function (): void {
        if (isWindows) {
            this.skip();
            return;
        }
        const dir = mkdtempSync(path.join(tmpdir(), 'aca-cli-test-'));
        const exe = path.join(dir, 'fake-aca');
        writeFileSync(exe, '#!/bin/sh\necho ok\n');
        chmodSync(exe, 0o755);
        process.env.PATH = dir;
        assert.strictEqual(resolveExecutable('fake-aca'), exe);
    });

    test('resolveExecutable returns the bare name when not found (so spawn surfaces ENOENT)', () => {
        process.env.PATH = isWindows ? 'C:\\Windows' : '/nonexistent-dir-xyz';
        assert.strictEqual(resolveExecutable('definitely-not-a-real-cli-9z9z9z'), 'definitely-not-a-real-cli-9z9z9z');
    });

    test('resolveExecutable returns absolute/relative inputs unchanged', () => {
        const absolute = isWindows ? 'C:\\tools\\aca.exe' : '/usr/local/bin/aca';
        assert.strictEqual(resolveExecutable(absolute), absolute);
        assert.strictEqual(resolveExecutable('./local/aca'), './local/aca');
    });
});
