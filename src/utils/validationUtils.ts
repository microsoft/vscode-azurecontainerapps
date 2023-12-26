/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize } from "./localize";

export interface ValidNumberFormatOptions {
    signType?: 'positive' | 'negative';
    allowFloat?: boolean;
    allowZero?: boolean;
}

export interface ValidAlphanumericAndSymbolsOptions {
    allowNumbers?: boolean;
    allowedAlphabetCasing?: 'case-insensitive' | 'uppercase' | 'lowercase' | 'none';
    requireLeadingAlphabet?: boolean;
    allowedSymbols?: string;
    allowSymbolRepetition?: boolean;
}

const invalidAlphabetOptionsMessage: string = localize('invalidAlphabetOptions', 'Invalid options. Cannot require leading alphabet character when alphabet casing is set to none.');
const invalidAlphanumericOptionsMessage: string = localize('invalidAlphanumericOptions', 'Invalid options. Alphanumeric validation requires at least one of alphabet casing or numerals to be allowed.');

export namespace validationUtils {
    const thirtyTwoBitMaxSafeInteger: number = 2147483647;
    const thirtyTwoBitMinSafeInteger: number = -2147483648;
    const allSymbols: string = '[-\/\\^$*+?.()|[\]{}]';
    const alphanumericAndSymbolsDefault: ValidAlphanumericAndSymbolsOptions = {
        allowNumbers: true,
        allowedAlphabetCasing: 'case-insensitive',
        allowedSymbols: '-',
        allowSymbolRepetition: true,
        requireLeadingAlphabet: false
    };

    export function hasValidNumberValue(value: string, lowerLimitIncl?: number, upperLimitIncl?: number): boolean {
        const numberValue = parseFloat(value);
        if (isNaN(numberValue)) {
            return false;
        }

        lowerLimitIncl = (!lowerLimitIncl || lowerLimitIncl < thirtyTwoBitMinSafeInteger) ? thirtyTwoBitMinSafeInteger : lowerLimitIncl;
        upperLimitIncl = (!upperLimitIncl || upperLimitIncl > thirtyTwoBitMaxSafeInteger) ? thirtyTwoBitMaxSafeInteger : upperLimitIncl;

        return lowerLimitIncl <= upperLimitIncl && numberValue >= lowerLimitIncl && numberValue <= upperLimitIncl;
    }

    export function getInvalidNumberValueMessage(lowerLimitIncl?: number, upperLimitIncl?: number): string {
        if (lowerLimitIncl && !upperLimitIncl) {
            return localize('numberValueTooSmall', `The value must be greater than or equal to {0}.`, lowerLimitIncl);
        } else if (!lowerLimitIncl && upperLimitIncl) {
            return localize('numberValueTooLarge', `The value must less than or equal to {0}.`, upperLimitIncl);
        } else {
            return localize('invalidNumberValue', `The value must be between {0} and {1}.`, lowerLimitIncl, upperLimitIncl);
        }
    }

    export function hasValidNumberFormat(value: string, options?: ValidNumberFormatOptions): boolean {
        let pattern: string = '^';

        if (options?.signType === 'negative') {
            pattern += '-';
        } else if (options?.signType === 'positive') {
            // Add nothing
        } else {
            pattern += '-?';
        }

        if (options?.allowZero) {
            pattern += '\\d+';
        } else {
            pattern += '[1-9]\\d*';
        }

        if (options?.allowFloat) {
            pattern += '(\\.\\d+)?';
        }

        pattern += '$';

        const regex: RegExp = new RegExp(pattern);
        return regex.test(value);
    }

    export function getInvalidNumberFormatMessage(options: ValidNumberFormatOptions): string {
        const signType: string = options.signType ? options.signType + ' ' : '';
        const decimalType: string = options.allowFloat ? 'real ' : 'whole ';
        const zeroType: string = options.allowZero ? ' or zero' : '';
        return localize('invalidNumberTypeMessage', `The value must be a ${signType}${decimalType}number${zeroType}.`);
    }

    /**
     * Validates that the given input string is the appropriate length as determined by the optional lower and upper limit parameters
     */
    export function hasValidCharLength(value: string, lowerLimitIncl?: number, upperLimitIncl?: number): boolean {
        lowerLimitIncl = (!lowerLimitIncl || lowerLimitIncl < 1) ? 1 : lowerLimitIncl;
        upperLimitIncl = (!upperLimitIncl || upperLimitIncl > Number.MAX_SAFE_INTEGER) ? Number.MAX_SAFE_INTEGER : upperLimitIncl;
        return lowerLimitIncl <= upperLimitIncl && value.length >= lowerLimitIncl && value.length <= upperLimitIncl;
    }

    /**
     * Provides a message that can be used to inform the user of invalid input lengths as determined by the optional lower and upper limit parameters
     * @see hasValidCharLength
     */
    export function getInvalidCharLengthMessage(lowerLimitIncl?: number, upperLimitIncl?: number): string {
        if (!lowerLimitIncl && !upperLimitIncl) {
            return localize('invalidInputLength', 'A value is required to proceed.');
        } else if (lowerLimitIncl && !upperLimitIncl) {
            return localize('inputLengthTooShort', 'The value must be {0} characters or greater.', lowerLimitIncl);
        } else if (!lowerLimitIncl && upperLimitIncl) {
            return localize('inputLengthTooLong', 'The value must be {0} characters or less.', upperLimitIncl);
        } else {
            return localize('invalidBetweenInputLength', 'The value must be between {0} and {1} characters long.', lowerLimitIncl, upperLimitIncl);
        }
    }

    /**
     * Validates that the given input string consists of lower case alphanumeric characters,
     * starts and ends with an alphanumeric character, and does not contain any special symbols not explicitly specified
     *
     * @param value The original input string to validate
     * @param symbols Any custom symbols that are also allowed in the input string. Defaults to '-'.
     *
     * @example
     * "abcd-1234" // returns true
     * "-abcd-1234" // returns false
     */
    export function hasValidAlphanumericAndSymbols(value: string, options?: ValidAlphanumericAndSymbolsOptions): boolean {
        options = { ...alphanumericAndSymbolsDefault, ...(options ?? {}) };

        if (options.allowedAlphabetCasing === 'none' && options.requireLeadingAlphabet) {
            throw new Error(invalidAlphabetOptionsMessage);
        }

        if (options.allowedAlphabetCasing === 'none' && options.allowNumbers === false) {
            throw new Error(invalidAlphanumericOptionsMessage);
        }

        let alphabetPattern: string;
        switch (options.allowedAlphabetCasing) {
            case 'uppercase':
                alphabetPattern = 'A-Z';
                break;
            case 'lowercase':
                alphabetPattern = 'a-z';
                break;
            case 'none':
                alphabetPattern = '';
                break;
            case 'case-insensitive':
            default:
                alphabetPattern = 'a-zA-Z';
        }

        const numericPattern: string = options.allowNumbers ? '0-9' : '';
        const alphanumericPattern: string = alphabetPattern + numericPattern;
        // Search through the passed symbols and match any allowed symbols
        // If we find a match, escape the symbol using '\\$&'
        const symbolPattern: string = (options.allowedSymbols as string).replace(new RegExp(allSymbols, 'g'), '\\$&');

        const validAlphanumericAndSymbols: RegExp = new RegExp(`^[${options.requireLeadingAlphabet ? alphabetPattern : alphanumericPattern}](?:[${alphanumericPattern}${symbolPattern}]*[${alphanumericPattern}])?$`);
        const symbolsRepeat: RegExp = new RegExp('[^a-z0-9]{2}', 'g');
        return validAlphanumericAndSymbols.test(value) && (!!options.allowSymbolRepetition || !symbolsRepeat.test(value));
    }

    /**
     * @param symbols Any custom symbols that are also allowed in the input string. Defaults to '-'.
     */
    export function getInvalidAlphanumericAndSymbolsMessage(options?: ValidAlphanumericAndSymbolsOptions): string {
        options = { ...alphanumericAndSymbolsDefault, ...(options ?? {}) };

        if (options.allowedAlphabetCasing === 'none' && options.requireLeadingAlphabet) {
            throw new Error(invalidAlphabetOptionsMessage);
        }

        if (options.allowedAlphabetCasing === 'none' && options.allowNumbers === false) {
            throw new Error(invalidAlphanumericOptionsMessage);
        }

        let caseMessage: string = '';
        switch (options.allowedAlphabetCasing) {
            case 'uppercase':
                caseMessage = 'upper-case ';
                break;
            case 'lowercase':
                caseMessage = 'lower-case ';
                break;
            case 'none':
            case 'case-insensitive':
            default:
                caseMessage = '';
        }

        let charTypeMessage: string;
        switch (true) {
            case options.allowedAlphabetCasing !== 'none' && options.allowNumbers:
                charTypeMessage = 'alphanumeric';
                break;
            case options.allowNumbers:
                charTypeMessage = 'numeric';
                break;
            case options.allowedAlphabetCasing !== 'none':
                charTypeMessage = 'alphabet';
                break;
            default:
                charTypeMessage = '';
        }

        const nonRepeatingMessage: string = options.allowSymbolRepetition ? '' : 'non-repeating ';
        const leadingCharMessage: string = options.requireLeadingAlphabet ? `begin with ${caseMessage}alphabet characters, followed by ` : 'consist of ';

        return localize('invalidAlphanumericAndSymbols', `The value must ${leadingCharMessage}${caseMessage}${charTypeMessage} characters or one of the following ${nonRepeatingMessage}symbols: "${options.allowedSymbols}", and must ${options.requireLeadingAlphabet ? '' : 'start and '}end with ${caseMessage}${charTypeMessage} characters.`);
    }
}
