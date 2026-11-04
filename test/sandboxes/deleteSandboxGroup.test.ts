/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import { waitForSandboxGroupDeletion, waitForSandboxGroupResourceListDeletion } from '../../src/commands/sandboxes/deleteSandboxGroup';

suite('Delete Container Apps sandbox group', () => {
    test('waits until ARM reports the sandbox group is not found', async () => {
        let getCount = 0;
        const delays: number[] = [];

        await waitForSandboxGroupDeletion(
            'sandbox-group',
            async () => {
                getCount += 1;
                if (getCount === 3) {
                    throw { statusCode: 404 };
                }
            },
            async ms => { delays.push(ms); },
            5,
            1000,
        );

        assert.strictEqual(getCount, 3);
        assert.deepStrictEqual(delays, [1000, 1000]);
    });

    test('propagates unexpected ARM errors', async () => {
        const expected = new Error('Forbidden');
        Object.assign(expected, { statusCode: 403 });

        await assert.rejects(
            waitForSandboxGroupDeletion('sandbox-group', async () => { throw expected; }),
            error => error === expected,
        );
    });

    test('fails clearly when ARM never confirms deletion', async () => {
        await assert.rejects(
            waitForSandboxGroupDeletion('sandbox-group', async () => undefined, async () => undefined, 2, 0),
            /Timed out waiting for sandbox group "sandbox-group" to be deleted/,
        );
    });

    test('waits until the generic ARM resource list omits the sandbox group', async () => {
        const sandboxGroupId = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.App/sandboxGroups/sandbox-group';
        let listCount = 0;
        const delays: number[] = [];

        await waitForSandboxGroupResourceListDeletion(
            'sandbox-group',
            sandboxGroupId,
            async () => {
                listCount += 1;
                return listCount < 3 ? [sandboxGroupId.toUpperCase()] : [];
            },
            async ms => { delays.push(ms); },
            5,
            1000,
        );

        assert.strictEqual(listCount, 3);
        assert.deepStrictEqual(delays, [1000, 1000]);
    });

    test('fails clearly when the generic ARM resource list remains stale', async () => {
        const sandboxGroupId = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.App/sandboxGroups/sandbox-group';

        await assert.rejects(
            waitForSandboxGroupResourceListDeletion(
                'sandbox-group',
                sandboxGroupId,
                async () => [sandboxGroupId],
                async () => undefined,
                2,
                0,
            ),
            /was deleted, but Azure Resources has not finished updating/,
        );
    });
});
