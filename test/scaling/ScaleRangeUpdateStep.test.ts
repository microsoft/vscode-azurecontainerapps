/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import { shouldPreserveNullMinReplicas, shouldUpdateScaleRange } from '../../src/commands/scaling/scaleRange/ScaleRangeUpdateStep';

suite('ScaleRangeUpdateStep', () => {
    test('shouldUpdateScaleRange returns false for no-op updates', () => {
        assert.strictEqual(shouldUpdateScaleRange({
            newMinRange: 0,
            newMaxRange: 10,
            scaleMinRange: 0,
            scaleMaxRange: 10,
        }), false);
    });

    test('shouldUpdateScaleRange returns true when max range changes', () => {
        assert.strictEqual(shouldUpdateScaleRange({
            newMinRange: 0,
            newMaxRange: 20,
            scaleMinRange: 0,
            scaleMaxRange: 10,
        }), true);
    });

    test('shouldPreserveNullMinReplicas returns true when null min is unchanged', () => {
        assert.strictEqual(shouldPreserveNullMinReplicas({
            wasMinReplicasNull: true,
            newMinRange: 0,
            scaleMinRange: 0,
        }), true);
    });

    test('shouldPreserveNullMinReplicas returns false when min value changed', () => {
        assert.strictEqual(shouldPreserveNullMinReplicas({
            wasMinReplicasNull: true,
            newMinRange: 1,
            scaleMinRange: 0,
        }), false);
    });
});
