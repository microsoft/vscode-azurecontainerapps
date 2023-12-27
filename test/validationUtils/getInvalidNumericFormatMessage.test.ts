/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import { validationUtils, type ValidNumericFormatOptions } from '../../extension.bundle';

type InvalidNumericFormatMessageParams = {
    output: string;
    options?: ValidNumericFormatOptions
};

export function getInvalidNumericFormatMessageTest() {
    const parameterList: InvalidNumericFormatMessageParams[] = [
        // Default options
        {
            options: {},
            output: 'The value must be a real number or zero.'
        },

        // Positive
        {
            options: { signType: 'positive', allowFloat: true },
            output: 'The value must be a positive real number or zero.'
        },
        {
            options: { signType: 'positive', allowFloat: false },
            output: 'The value must be a positive whole number or zero.'
        },

        // Negative
        {
            options: { signType: 'negative' },
            output: 'The value must be a negative real number or zero.'
        },
        {
            options: { signType: 'negative', allowFloat: false },
            output: 'The value must be a negative whole number or zero.'
        },

        // Either
        {
            options: { signType: 'either' },
            output: 'The value must be a real number or zero.'
        },
        {
            options: { signType: 'either', allowFloat: false },
            output: 'The value must be a whole number or zero.'
        },

        // Decimal digits
        {
            options: { decimalDigits: 3 },
            output: 'The value must be a real number with up to 3 decimal places or zero.'
        },

        // Combinations
        {
            options: { signType: 'either', allowZero: true },
            output: 'The value must be a real number or zero.'
        },
        {
            options: { signType: 'either', allowZero: true, allowFloat: false },
            output: 'The value must be a whole number or zero.'
        },
        {
            options: { signType: 'either', allowZero: true, allowFloat: true, decimalDigits: 2 },
            output: 'The value must be a real number with up to 2 decimal places or zero.'
        },
        {
            options: { signType: 'either', allowZero: false, allowFloat: true, decimalDigits: 2 },
            output: 'The value must be a real number with up to 2 decimal places.'
        },
        {
            options: { signType: 'negative', allowZero: true, allowFloat: true, decimalDigits: 2 },
            output: 'The value must be a negative real number with up to 2 decimal places or zero.'
        },
        {
            options: { signType: 'positive', allowZero: true, allowFloat: true, decimalDigits: 2 },
            output: 'The value must be a positive real number with up to 2 decimal places or zero.'
        },
    ];

    for (const { output, options } of parameterList) {
        assert.equal(validationUtils.getInvalidNumericFormatMessage(options), output);
    }
}
