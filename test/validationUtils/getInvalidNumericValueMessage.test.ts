/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import { validationUtils } from '../../extension.bundle';

type InvalidNumericValueMessageParams = {
    output: string;
    lowerLimitIncl?: number;
    upperLimitIncl?: number;
};

export function getInvalidNumericValueMessageTest() {
    const parameterList: InvalidNumericValueMessageParams[] = [
        { output: 'A numeric value is required to proceed.' },
        { output: 'The numeric value must be greater than or equal to 5.', lowerLimitIncl: 5 },
        { output: 'The numeric value must be less than or equal to 5.', upperLimitIncl: 5 },
        { output: 'The numeric value must be between 2 and 5.', lowerLimitIncl: 2, upperLimitIncl: 5 },
    ];

    for (const { output, lowerLimitIncl, upperLimitIncl } of parameterList) {
        assert.equal(validationUtils.getInvalidNumericValueMessage(lowerLimitIncl, upperLimitIncl), output);
    }
}
