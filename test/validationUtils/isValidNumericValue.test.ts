/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import { validationUtils } from '../../extension.bundle';

type ValidNumericValueParams = {
    value: string;
    lowerLimitIncl?: number;
    upperLimitIncl?: number;
};

export function isValidNumericValueTest() {
    const trueValues: ValidNumericValueParams[] = [
        { value: '15', lowerLimitIncl: 10, },
        { value: '50', upperLimitIncl: 100, },
        { value: '75', lowerLimitIncl: 50, upperLimitIncl: 100, },
    ];

    for (const { value, lowerLimitIncl, upperLimitIncl } of trueValues) {
        assert.equal(validationUtils.isValidNumericValue(value, lowerLimitIncl, upperLimitIncl), true);
    }

    const falseValues: ValidNumericValueParams[] = [
        { value: 'abc', },
        { value: '5', lowerLimitIncl: 10, },
        { value: '120', upperLimitIncl: 100, },
        { value: '25', lowerLimitIncl: 50, upperLimitIncl: 100, },
        { value: '150', lowerLimitIncl: 50, upperLimitIncl: 100, },
    ];

    for (const { value, lowerLimitIncl, upperLimitIncl } of falseValues) {
        assert.equal(validationUtils.isValidNumericValue(value, lowerLimitIncl, upperLimitIncl), false);
    }
}
