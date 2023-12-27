/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import { validationUtils } from '../../extension.bundle';

type ValidCharLengthParams = {
    value: string;
    lowerLimitIncl?: number;
    upperLimitIncl?: number;
};

export function hasValidCharLengthTest() {
    const trueValues: ValidCharLengthParams[] = [
        { value: 'test' }, // No limits specified
        { value: 'abcdef', lowerLimitIncl: undefined, upperLimitIncl: 10 }, // No lower limit specified
        { value: 'abcdefghijklmnopqrstuvwxyz', lowerLimitIncl: 1 }, // No upper limit specified
        { value: 'a', lowerLimitIncl: 1, upperLimitIncl: 10 },  // At lower limit
        { value: '1234567890', lowerLimitIncl: 1, upperLimitIncl: 10 }, // At upper limit
        { value: 'abcd', lowerLimitIncl: 1, upperLimitIncl: 10 }, // Within limits
    ];

    for (const { value, lowerLimitIncl, upperLimitIncl } of trueValues) {
        assert.equal(validationUtils.hasValidCharLength(value, lowerLimitIncl, upperLimitIncl), true);
    }

    const falseValues: ValidCharLengthParams[] = [
        { value: '' },
        { value: '', lowerLimitIncl: 0, upperLimitIncl: 1 }, // Lower limit != 0
        { value: 'abcdefg', lowerLimitIncl: 5, upperLimitIncl: -5 },  // Lower limit > upper limit
        { value: 'abc', lowerLimitIncl: 4, upperLimitIncl: 10 }, // Below limit
        { value: '12345678901', lowerLimitIncl: 1, upperLimitIncl: 10 },  // Above limit
    ];

    for (const { value, lowerLimitIncl, upperLimitIncl } of falseValues) {
        assert.equal(validationUtils.hasValidCharLength(value, lowerLimitIncl, upperLimitIncl), false);
    }
}
