/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import { buildSandboxShellArgs } from '../../src/sandboxes/sandboxTerminal';

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
});
