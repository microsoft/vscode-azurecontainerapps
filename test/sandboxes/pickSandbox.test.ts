/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import { getSandboxContextValueFilter } from '../../src/utils/pickItem/pickSandbox';

suite('pickSandbox', () => {
    test('matches sandbox items when no state filter is provided', () => {
        const filter = getSandboxContextValueFilter();

        assert.strictEqual(filter.test('sandboxItem'), true);
        assert.strictEqual(filter.test('running'), false);
    });

    test('matches the running context segment for Stop', () => {
        const filter = getSandboxContextValueFilter('running');

        assert.strictEqual(filter.test('running'), true);
        assert.strictEqual(filter.test('suspended'), false);
        assert.strictEqual(filter.test('sandboxItem'), false);
    });

    test('matches the suspended context segment for Resume', () => {
        const filter = getSandboxContextValueFilter('suspended');

        assert.strictEqual(filter.test('suspended'), true);
        assert.strictEqual(filter.test('running'), false);
        assert.strictEqual(filter.test('sandboxItem'), false);
    });
});
