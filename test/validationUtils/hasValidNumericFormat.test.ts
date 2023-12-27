/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import { validationUtils, type ValidNumericFormatOptions } from '../../extension.bundle';

type ValidNumericFormatParams = {
    value: string;
    options?: ValidNumericFormatOptions
};

export function hasValidNumericFormatTest() {
    const trueValues: ValidNumericFormatParams[] = [
        // Default options
        { value: '100' },
        { value: '-100' },
        { value: '100.45' },
        { value: '-100.45' },
        { value: '0.456' },
        { value: '-0.456' },
        { value: '0.0' },
        { value: '-0.0' },

        // allowZero
        { value: '0', options: { signType: 'positive', allowZero: true } },
        { value: '0.0', options: { signType: 'positive', allowFloat: true } },
        { value: '0', options: { signType: 'positive', allowZero: true, allowFloat: true, decimalDigits: 2 } },
        { value: '-0', options: { signType: 'negative', allowZero: true } },
        { value: '-0.0', options: { signType: 'negative', allowZero: true, allowFloat: true, decimalDigits: 2 } },
        { value: '0', options: { signType: 'either', allowZero: true } },
        { value: '-0', options: { signType: 'either', allowZero: true } },

        // Positive
        { value: '100', options: { signType: 'positive' } },
        { value: '100.456', options: { signType: 'positive', allowFloat: true } },
        { value: '0.456', options: { signType: 'positive', allowFloat: true } },
        { value: '100.0', options: { signType: 'positive', allowFloat: true, decimalDigits: 2 } },
        { value: '100.4', options: { signType: 'positive', allowFloat: true, decimalDigits: 2 } },
        { value: '100.45', options: { signType: 'positive', allowFloat: true, decimalDigits: 2 } },

        // Negative
        { value: '-100', options: { signType: 'negative' } },
        { value: '-100.456', options: { signType: 'negative', allowFloat: true } },
        { value: '-0.456', options: { signType: 'negative', allowFloat: true } },
        { value: '-100.4', options: { signType: 'negative', allowFloat: true, decimalDigits: 2 } },
        { value: '-100.45', options: { signType: 'negative', allowFloat: true, decimalDigits: 2 } },

        // Either
        { value: '100', options: { signType: 'either' } },
        { value: '-100', options: { signType: 'either' } },
        { value: '100.456', options: { signType: 'either', allowFloat: true } },
        { value: '-100.456', options: { signType: 'either', allowFloat: true } },
        { value: '-0.45', options: { signType: 'either', allowFloat: true } },
        { value: '0.45', options: { signType: 'either', allowFloat: true } },
        { value: '-100.45', options: { signType: 'either', allowFloat: true, decimalDigits: 2 } },
        { value: '100.45', options: { signType: 'either', allowFloat: true, decimalDigits: 2 } },
    ];

    for (const { value, options } of trueValues) {
        assert.equal(validationUtils.hasValidNumericFormat(value, options), true);
    }

    const falseValues: ValidNumericFormatParams[] = [
        // Default options
        { value: '' },
        { value: 'abc' },
        { value: '123.45.67' },
        { value: '-123.45.67' },
        { value: '007' }, // Don't allow leading zeros

        // allowZero
        { value: '0', options: { signType: 'positive', allowZero: false } },
        { value: '0.0', options: { signType: 'positive', allowZero: false } },
        { value: '0.0', options: { signType: 'positive', allowZero: true, allowFloat: false } },
        { value: '-0', options: { signType: 'negative', allowZero: false } },
        { value: '-0.0', options: { signType: 'negative', allowZero: false } },
        { value: '-0.0', options: { signType: 'negative', allowZero: true, allowFloat: false } },
        { value: '0', options: { signType: 'either', allowZero: false } },
        { value: '0.0', options: { signType: 'either', allowZero: false } },
        { value: '-0', options: { signType: 'either', allowZero: false } },
        { value: '-0.0', options: { signType: 'either', allowZero: false } },

        // Positive
        { value: '-100', options: { signType: 'positive' } },
        { value: '0.45', options: { signType: 'positive', allowFloat: false } },
        { value: '100.456', options: { signType: 'positive', allowFloat: true, decimalDigits: 2 } },
        { value: '123.45.67', options: { signType: 'positive', allowZero: true } },

        // Negative
        { value: '100', options: { signType: 'negative' } },
        { value: '-0.45', options: { signType: 'negative', allowFloat: false } },
        { value: '-100.456', options: { signType: 'negative', allowFloat: true, decimalDigits: 2 } },
        { value: '-123.45.67', options: { signType: 'negative', allowZero: true } },

        // Either
        { value: '0.45', options: { signType: 'either', allowFloat: false } },
        { value: '100.456', options: { signType: 'either', allowFloat: true, decimalDigits: 2 } },
        { value: '-0.45', options: { signType: 'either', allowFloat: false } },
        { value: '-100.456', options: { signType: 'either', allowFloat: true, decimalDigits: 2 } },
        { value: '-123.45.67', options: { signType: 'either', allowZero: true } },

        // allowFloat, decimalDigits mismatch
        { value: '0.45', options: { allowFloat: true, decimalDigits: 0 } },
        { value: '0.45', options: { allowFloat: false, decimalDigits: 2 } },
    ];

    for (const { value, options } of falseValues) {
        try {
            assert.equal(validationUtils.hasValidNumericFormat(value, options), false);
        } catch {
            continue;
        }
    }
}
