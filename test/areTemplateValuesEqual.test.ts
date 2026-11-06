/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import { areTemplateValuesEqual } from '../src/utils/areTemplateValuesEqual';

suite('areTemplateValuesEqual', () => {
    test('ignores omitted SDK fields at every nesting level', () => {
        const original = {
            containers: [{ name: 'app', env: [{ name: 'message', value: '1', secretRef: undefined }] }],
            scale: { maxReplicas: 1, allowScalingRuleOverride: undefined },
            initContainers: undefined,
        };
        const draft = {
            scale: { maxReplicas: 1 },
            containers: [{ env: [{ value: '1', name: 'message' }], name: 'app' }],
        };

        assert.strictEqual(areTemplateValuesEqual(original, draft), true);
        assert.strictEqual(areTemplateValuesEqual(draft, original), true);
    });

    test('detects changed or removed nested values despite omitted SDK fields', () => {
        const original = { scale: { maxReplicas: 1, allowScalingRuleOverride: undefined } };

        assert.strictEqual(areTemplateValuesEqual(original, { scale: { maxReplicas: 2 } }), false);
        assert.strictEqual(areTemplateValuesEqual(original, { scale: {} }), false);
        assert.strictEqual(areTemplateValuesEqual(original, {}), false);
    });

    test('detects reordered or removed array entries', () => {
        const first = { name: 'first', http: { metadata: { concurrentRequests: '10' } } };
        const second = { name: 'second', http: { metadata: { concurrentRequests: '20' } } };
        const original = { scale: { rules: [first, second] } };

        assert.strictEqual(areTemplateValuesEqual(original, { scale: { rules: [second, first] } }), false);
        assert.strictEqual(areTemplateValuesEqual(original, { scale: { rules: [first] } }), false);
    });

    test('handles missing values without equating them to explicit values', () => {
        assert.strictEqual(areTemplateValuesEqual(undefined, undefined), true);
        for (const value of [null, false, 0, '', {}, []]) {
            assert.strictEqual(areTemplateValuesEqual(undefined, value), false);
            assert.strictEqual(areTemplateValuesEqual(value, undefined), false);
            assert.strictEqual(areTemplateValuesEqual({ scale: undefined }, { scale: value }), false);
        }
    });
});
