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
        // Default options
        { value: 'hello123' },
        { value: 'Hello-World123' },
        { value: 'hello--world' },
        { value: 'a' },
        { value: '123' },
        { value: '12-3' },
        { value: 'he-ll-o' },

        // allowedSymbols
        { value: 'hello-world', options: { allowedSymbols: '-' } },
        { value: 'hello@world', options: { allowedSymbols: '@%' } },
        { value: 'he!l@l#o', options: { allowedSymbols: '!@#' } },

        // allowedSymbols, allowSymbolRepetition
        { value: 'hello---world', options: { allowedSymbols: '-', allowSymbolRepetition: true } },
        { value: 'hello--w&o&&rld', options: { allowedSymbols: '-&', allowSymbolRepetition: true } },

        // allowNumbers
        { value: '123', options: { allowNumbers: true } },
        { value: '123hello', options: { allowNumbers: true } },

        // allowedAlphabetCasing: uppercase
        { value: 'HELLO', options: { allowedAlphabetCasing: 'uppercase' } },
        { value: '123HELLO', options: { allowedAlphabetCasing: 'uppercase' } },
        { value: 'A123HELLO', options: { allowedAlphabetCasing: 'uppercase', requireLeadingAlphabet: true } },

        // allowedAlphabetCasing: lowercase
        { value: 'hello', options: { allowedAlphabetCasing: 'lowercase' } },
        { value: '123hello', options: { allowedAlphabetCasing: 'lowercase' } },
        { value: 'a123hello', options: { allowedAlphabetCasing: 'lowercase', requireLeadingAlphabet: true } },

        // allowedAlphabetCasing: case-insensitive
        { value: 'HeLLo', options: { allowedAlphabetCasing: 'case-insensitive' } },
        { value: '123HeLLo', options: { allowedAlphabetCasing: 'case-insensitive' } },
        { value: 'a123HeLLo', options: { allowedAlphabetCasing: 'case-insensitive', requireLeadingAlphabet: true } },

        // allowedAlphabetCasing: none
        { value: '123', options: { allowedAlphabetCasing: 'none' } },

        // Combined options
        { value: 'Hello--World@@123', options: { allowedSymbols: '-@', allowedAlphabetCasing: 'case-insensitive', allowNumbers: true, requireLeadingAlphabet: true, allowSymbolRepetition: true } },
        { value: '1234', options: { allowedSymbols: '', allowedAlphabetCasing: 'uppercase', allowNumbers: true, allowSymbolRepetition: false } },
        { value: 'abcd', options: { allowedSymbols: '', allowedAlphabetCasing: 'lowercase', allowNumbers: true, allowSymbolRepetition: false } },
    ];

    for (const { value, options } of trueValues) {
        assert.equal(validationUtils.hasValidAlphanumericAndSymbols(value, options), true);
    }

    const falseValues: ValidAlphanumericAndSymbolsParams[] = [
        // Default options
        { value: '' },
        { value: 'a b' },
        { value: 'hello_world' },
        { value: 'hello123-' },
        { value: '-hello123' },
        { value: '12.3' },

        // allowedSymbols
        { value: '123-8.@9', options: { allowedSymbols: '-.' } },
        { value: 'he!l@l#o$', options: { allowedSymbols: '!@#$' } },

        // allowedSymbols, allowSymbolRepetition
        { value: 'hello--world', options: { allowedSymbols: '-', allowSymbolRepetition: false } },
        { value: 'he!l@l#$o', options: { allowedSymbols: '!@#$', allowSymbolRepetition: false } },
        { value: 'hello--world', options: { allowedSymbols: '-', allowSymbolRepetition: false } },

        // allowNumbers
        { value: 'hello123', options: { allowNumbers: false } },
        { value: '1234', options: { allowNumbers: false } },

        // allowedAlphabetCasing: uppercase
        { value: 'Hello', options: { allowedAlphabetCasing: 'uppercase' } },
        { value: '123hello', options: { allowedAlphabetCasing: 'uppercase' } },

        // allowedAlphabetCasing: lowercase
        { value: 'HeLLo123', options: { allowedAlphabetCasing: 'lowercase' } },
        { value: 'HELLO123', options: { allowedAlphabetCasing: 'lowercase' } },

        // allowedAlphabetCasing: none
        { value: 'abcd', options: { allowedAlphabetCasing: 'none' } },
        { value: 'ABCD', options: { allowedAlphabetCasing: 'none' } },
        { value: 'ABcd123', options: { allowedAlphabetCasing: 'none' } },

        // requireLeadingAlphabet
        { value: 'a123Hello', options: { allowedAlphabetCasing: 'uppercase', requireLeadingAlphabet: true } },
        { value: 'A123hello', options: { allowedAlphabetCasing: 'lowercase', requireLeadingAlphabet: true } },
        { value: '123Hello', options: { allowedAlphabetCasing: 'case-insensitive', requireLeadingAlphabet: true } },
        { value: 'abcd', options: { allowedAlphabetCasing: 'none', requireLeadingAlphabet: true } },

        // Combined options
        { value: 'Hello--World@@123', options: { allowedSymbols: '-@', allowedAlphabetCasing: 'uppercase', allowNumbers: false, requireLeadingAlphabet: true, allowSymbolRepetition: true } },
        { value: 'abcd-@123', options: { allowedSymbols: '-@', allowedAlphabetCasing: 'none', allowNumbers: true, requireLeadingAlphabet: true, allowSymbolRepetition: true } },
        { value: '1bcd-@123', options: { allowedSymbols: '-@', allowNumbers: true, requireLeadingAlphabet: true, allowSymbolRepetition: true } },
        { value: 'Abcd-@@123', options: { allowedSymbols: '-@', allowedAlphabetCasing: 'case-insensitive', allowNumbers: true, requireLeadingAlphabet: true, allowSymbolRepetition: false } },
        { value: 'Abcd-@@123', options: { allowedSymbols: '-@', allowedAlphabetCasing: 'uppercase', allowNumbers: true, requireLeadingAlphabet: true, allowSymbolRepetition: false } },
        { value: 'Abcd-@@123', options: { allowedSymbols: '-@', allowedAlphabetCasing: 'lowercase', allowNumbers: true, requireLeadingAlphabet: true, allowSymbolRepetition: false } },
        { value: 'abcd-123', options: { allowedSymbols: '%', allowedAlphabetCasing: 'lowercase', allowNumbers: true, requireLeadingAlphabet: true, allowSymbolRepetition: false } },
        { value: 'abcd-123', options: { allowedSymbols: '', allowedAlphabetCasing: 'lowercase', allowNumbers: true, requireLeadingAlphabet: true, allowSymbolRepetition: false } },
        { value: '1234', options: { allowedSymbols: '', allowedAlphabetCasing: 'uppercase', allowNumbers: true, requireLeadingAlphabet: true, allowSymbolRepetition: false } },
    ];

    for (const { value, options } of falseValues) {
        try {
            assert.equal(validationUtils.hasValidAlphanumericAndSymbols(value, options), false);
        } catch {
            continue;
        }
    }
}
