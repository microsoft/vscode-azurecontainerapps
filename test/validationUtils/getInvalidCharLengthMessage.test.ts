/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import { validationUtils } from '../../extension.bundle';

type InvalidCharLengthMessageParams = {
    output: string;
    lowerLimitIncl?: number;
    upperLimitIncl?: number;
};

export function getInvalidCharLengthMessageTest() {
    const parameterList: InvalidCharLengthMessageParams[] = [
        { output: 'A value is required to proceed.' },
        { output: 'The value must be 5 characters or greater.', lowerLimitIncl: 5 },
        { output: 'The value must be 5 characters or less.', upperLimitIncl: 5 },
        { output: 'The value must be between 2 and 5 characters long.', lowerLimitIncl: 2, upperLimitIncl: 5 },
    ];

    for (const { output, lowerLimitIncl, upperLimitIncl } of parameterList) {
        assert.equal(validationUtils.getInvalidCharLengthMessage(lowerLimitIncl, upperLimitIncl), output);
    }
}
