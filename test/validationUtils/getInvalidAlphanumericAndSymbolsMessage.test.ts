/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert = require('assert');
import { validationUtils, type ValidAlphanumericAndSymbolsOptions } from '../../extension.bundle';

type InvalidAlphanumericAndSymbolsMessageParams = {
    output: string;
    options?: ValidAlphanumericAndSymbolsOptions
};

export function getInvalidAlphanumericAndSymbolsMessageTest() {
    const optionsList: InvalidAlphanumericAndSymbolsMessageParams[] = [
        // Default options
        {
            options: {},
            output: 'The value must consist of alphanumeric characters or one of the following symbols: "-", and must start and end with alphanumeric characters.'
        },

        // allowedSymbols
        {
            options: { allowedSymbols: '-@%' },
            output: 'The value must consist of alphanumeric characters or one of the following symbols: "-@%", and must start and end with alphanumeric characters.',
        },

        // allowedSymbols, allowSymbolRepetition
        {
            options: { allowSymbolRepetition: true },
            output: 'The value must consist of alphanumeric characters or one of the following symbols: "-", and must start and end with alphanumeric characters.',
        },
        {
            options: { allowSymbolRepetition: false },
            output: 'The value must consist of alphanumeric characters or one of the following non-repeating symbols: "-", and must start and end with alphanumeric characters.',
        },

        // allowNumbers
        {
            options: { allowNumbers: true },
            output: 'The value must consist of alphanumeric characters or one of the following symbols: "-", and must start and end with alphanumeric characters.',
        },
        {
            options: { allowNumbers: false },
            output: 'The value must consist of alphabet characters or one of the following symbols: "-", and must start and end with alphabet characters.',
        },

        // allowedAlphabetCasing
        {
            options: { allowedAlphabetCasing: 'uppercase' },
            output: 'The value must consist of upper-case alphanumeric characters or one of the following symbols: "-", and must start and end with upper-case alphanumeric characters.',
        },
        {
            options: { allowedAlphabetCasing: 'lowercase' },
            output: 'The value must consist of lower-case alphanumeric characters or one of the following symbols: "-", and must start and end with lower-case alphanumeric characters.',
        },
        {
            options: { allowedAlphabetCasing: 'case-insensitive' },
            output: 'The value must consist of alphanumeric characters or one of the following symbols: "-", and must start and end with alphanumeric characters.',
        },
        {
            options: { allowedAlphabetCasing: 'none' },
            output: 'The value must consist of numeric characters or one of the following symbols: "-", and must start and end with numeric characters.',
        },

        // Combinations
        {
            options: { allowedAlphabetCasing: 'case-insensitive', allowNumbers: true, requireLeadingAlphabet: true, allowSymbolRepetition: true },
            output: 'The value must begin with alphabet characters, followed by alphanumeric characters or one of the following symbols: "-", and must end with alphanumeric characters.',
        },
        {
            options: { allowedAlphabetCasing: 'case-insensitive', allowNumbers: false, requireLeadingAlphabet: false, allowSymbolRepetition: false },
            output: 'The value must consist of alphabet characters or one of the following non-repeating symbols: "-", and must start and end with alphabet characters.',
        },
        {
            options: { allowedAlphabetCasing: 'lowercase', allowNumbers: true, requireLeadingAlphabet: true, allowSymbolRepetition: true },
            output: 'The value must begin with lower-case alphabet characters, followed by lower-case alphanumeric characters or one of the following symbols: "-", and must end with lower-case alphanumeric characters.',
        },
        {
            options: { allowedAlphabetCasing: 'lowercase', allowNumbers: false, requireLeadingAlphabet: false, allowSymbolRepetition: false },
            output: 'The value must consist of lower-case alphabet characters or one of the following non-repeating symbols: "-", and must start and end with lower-case alphabet characters.',
        },
        {
            options: { allowedAlphabetCasing: 'uppercase', allowNumbers: true, requireLeadingAlphabet: true, allowSymbolRepetition: true },
            output: 'The value must begin with upper-case alphabet characters, followed by upper-case alphanumeric characters or one of the following symbols: "-", and must end with upper-case alphanumeric characters.',
        },
        {
            options: { allowedAlphabetCasing: 'uppercase', allowNumbers: false, requireLeadingAlphabet: false, allowSymbolRepetition: false },
            output: 'The value must consist of upper-case alphabet characters or one of the following non-repeating symbols: "-", and must start and end with upper-case alphabet characters.',
        },
        {
            options: { allowedAlphabetCasing: 'none', allowNumbers: true, allowSymbolRepetition: false },
            output: 'The value must consist of numeric characters or one of the following non-repeating symbols: "-", and must start and end with numeric characters.',
        },
    ];

    for (const { output, options } of optionsList) {
        assert.equal(validationUtils.getInvalidAlphanumericAndSymbolsMessage(options), output);
    }
}
