/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import { validationUtils, type ValidAlphanumericAndSymbolsOptions } from '../../extension.bundle';

type ValidAlphanumericAndSymbolsParams = {
    value: string;
    options?: ValidAlphanumericAndSymbolsOptions
};

export function hasValidAlphanumericAndSymbolsTest() {
    const trueValues: ValidAlphanumericAndSymbolsParams[] = [
        { value: 'hello123' },
        { value: 'hello-world' },
        { value: 'hello-world', options: { allowedSymbols: '-' } },
        { value: 'hello@world', options: { allowedSymbols: '@%' } },
        { value: 'he!l@l#o', options: { allowedSymbols: '!@#' } },
        { value: 'hello--world', options: { allowedSymbols: '-' } },
        { value: 'hello---world', options: { allowedSymbols: '-', canSymbolsRepeat: true } },
        { value: 'a' },
        { value: '123' },
        { value: '12-3' },
        { value: 'he-ll-o' },
    ];

    for (const { value, options } of trueValues) {
        assert.equal(validationUtils.hasValidAlphanumericAndSymbols(value, options), true);
    }

    const falseValues: ValidAlphanumericAndSymbolsParams[] = [
        { value: 'hello_world' },
        { value: 'Hello123' },
        { value: '' },
        { value: 'A' },
        { value: 'hello123-' },
        { value: '-hello123' },
        { value: 'hello--world', options: { allowedSymbols: '-', canSymbolsRepeat: false } },
        { value: '12.3' },
        { value: '123-8.@9', options: { allowedSymbols: '-.' } },
        { value: 'he!l@l#o$', options: { allowedSymbols: '!@#$' } },
        { value: 'he!l@l#$o', options: { allowedSymbols: '!@#$', canSymbolsRepeat: false } }
    ];

    for (const { value, options } of falseValues) {
        assert.equal(validationUtils.hasValidAlphanumericAndSymbols(value, options), false);
    }
}
