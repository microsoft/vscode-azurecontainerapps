/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import * as path from 'path';
import { buildSandboxShellArgs, createSandboxTerminalOptions, resolveAcaExecutable } from '../../src/sandboxes/sandboxTerminal';

suite('sandboxTerminal', () => {
    test('builds an interactive shell command with regional routing', () => {
        assert.deepStrictEqual(buildSandboxShellArgs({
            subscriptionId: 'sub1',
            resourceGroup: 'rg1',
            groupName: 'group1',
            region: 'westus2',
            sandboxId: 'sandbox1',
        }), [
            'sandbox',
            'shell',
            '-s',
            'sub1',
            '-g',
            'rg1',
            '--group',
            'group1',
            '--region',
            'westus2',
            '--id',
            'sandbox1',
        ]);
    });

    test('resolves an installed ACA executable from the search path', () => {
        const executableName = process.platform === 'win32' ? 'aca.exe' : 'aca';
        const expected = path.join('/tools', executableName);

        assert.strictEqual(resolveAcaExecutable(undefined, ['/missing', '/tools'], candidate => candidate === expected), expected);
    });

    test('returns undefined when the ACA executable is missing', () => {
        assert.strictEqual(resolveAcaExecutable(undefined, ['/missing'], () => false), undefined);
    });

    test('preserves a configured ACA executable path', () => {
        const configuredPath = path.resolve('custom', process.platform === 'win32' ? 'aca.exe' : 'aca');

        assert.strictEqual(resolveAcaExecutable(configuredPath, [], candidate => candidate === configuredPath), configuredPath);
    });

    test('uses the resolved executable in terminal options', () => {
        const options = createSandboxTerminalOptions('sandbox', {
            subscriptionId: 'sub1',
            resourceGroup: 'rg1',
            groupName: 'group1',
            region: 'westus2',
            sandboxId: 'sandbox1',
        }, '/tools/aca');

        assert.strictEqual(options.shellPath, '/tools/aca');
    });
});
