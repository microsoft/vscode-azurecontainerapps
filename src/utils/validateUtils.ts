/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize } from "./localize";

export interface ValidNumberTypeOptions {
    signType?: 'positive' | 'negative';
    allowFloat?: boolean;
    allowZero?: boolean;
}

export namespace validateUtils {
    const allowedSymbols: string = '[-\/\\^$*+?.()|[\]{}]';

    /**
     * Validates that the given input string is the appropriate length as determined by the optional lower and upper limit parameters
     */
    export function hasValidCharLength(value: string, lowerLimitIncl?: number, upperLimitIncl?: number): boolean {
        lowerLimitIncl ??= (!lowerLimitIncl || lowerLimitIncl < 1) ? 1 : lowerLimitIncl;
        upperLimitIncl = (!upperLimitIncl || upperLimitIncl > Number.MAX_SAFE_INTEGER) ? Number.MAX_SAFE_INTEGER : upperLimitIncl;

        if (lowerLimitIncl > upperLimitIncl || value.length < lowerLimitIncl || value.length > upperLimitIncl) {
            return false;
        } else {
            return true;
        }
    }

    /**
     * Provides a message that can be used to inform the user of invalid input lengths as determined by the optional lower and upper limit parameters
     */
    export const getInvalidCharLengthMessage = (lowerLimitIncl?: number, upperLimitIncl?: number): string => {
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

    export function isValidNumberType(value: string, options: ValidNumberTypeOptions): boolean {
        let pattern: string = '^';

        if (options.signType === 'negative') {
            pattern += '-';
        } else if (options.signType === 'positive') {
            // Add nothing
        } else {
            pattern += '-?';
        }

        if (options.allowZero) {
            pattern += '\\d+';
        } else {
            pattern += '[1-9]\\d*';
        }

        if (options.allowFloat) {
            pattern += '(\\.\\d+)?';
        }

        pattern += '$';

        const regex: RegExp = new RegExp(pattern);
        return regex.test(value);
    }

    export function getInvalidNumberTypeMessage(options?: ValidNumberTypeOptions): string {
        const signType: string = options?.signType ? options.signType + ' ' : '';
        const decimalType: string = options?.allowFloat ? 'real ' : 'whole ';
        const zeroType: string = options?.allowZero ? ' or zero' : '';
        return localize('invalidNumberTypeMessage', `The value must be a ${signType}${decimalType}number${zeroType}.`);
    }

    export function hasValidNumberValue(value: string, lowerLimitIncl?: number, upperLimitIncl?: number): boolean {
        const coerceToNumber: boolean = !isNaN(parseFloat(value));
        if (!coerceToNumber) {
            return false;
        }

        lowerLimitIncl = (!lowerLimitIncl || lowerLimitIncl < -2147483648) ? -2147483648 : lowerLimitIncl;
        upperLimitIncl = (!upperLimitIncl || upperLimitIncl > 2147483647) ? 2147483647 : upperLimitIncl;

        if (lowerLimitIncl > upperLimitIncl || value.length < lowerLimitIncl || value.length > upperLimitIncl) {
            return false;
        } else {
            return true;
        }
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
    export function isLowerCaseAlphanumericWithSymbols(value: string, symbols: string = '-'): boolean {
        // Search through the passed symbols and match any allowed symbols
        // If we find a match, escape the symbol using '\\$&'
        const symbolPattern: string = symbols.replace(new RegExp(allowedSymbols, 'g'), '\\$&');
        const pattern: RegExp = new RegExp(`^[a-z0-9](?:[a-z0-9${symbolPattern}]*[a-z0-9])?$`);
        return pattern.test(value);
    }

    /**
     * @param symbols Any custom symbols that are also allowed in the input string. Defaults to '-'.
     */
    export function getInvalidLowerCaseAlphanumericWithSymbolsMessage(symbols: string = '-'): string {
        return localize('invalidLowerAlphanumericWithSymbols', `A value must consist of lower case alphanumeric characters or one of the following symbols: "{0}", and must start and end with a lower case alphanumeric character.`, symbols);
    }
}
