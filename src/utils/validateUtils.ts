/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize } from "./localize";

export namespace validateUtils {
    const thirtyTwoBitMaxSafeInteger: number = 2147483647;
    // Estimated using UTF-8 encoding, where a character can be up to ~4 bytes long
    const maxSafeCharacterLength: number = thirtyTwoBitMaxSafeInteger / 32;
    const allowedSymbols: string = '[-\/\\^$*+?.()|[\]{}]';

    /**
     * Validates that the given input string is the appropriate length as determined by the optional lower and upper limit parameters
     */
    export function isValidLength(value: string, lowerLimitIncl?: number, upperLimitIncl?: number): boolean {
        lowerLimitIncl ??= 1;
        upperLimitIncl = (!upperLimitIncl || upperLimitIncl > maxSafeCharacterLength) ? maxSafeCharacterLength : upperLimitIncl;

        if (lowerLimitIncl > upperLimitIncl || value.length < lowerLimitIncl || value.length > upperLimitIncl) {
            return false;
        } else {
            return true;
        }
    }

    /**
     * Provides a message that can be used to inform the user of invalid input lengths as determined by the optional lower and upper limit parameters
     */
    export const getInvalidLengthMessage = (lowerLimitIncl?: number, upperLimitIncl?: number): string => {
        if (!lowerLimitIncl && !upperLimitIncl) {
            // Could technically also correspond to a 'maxSafeCharacterLength' overflow (see 'isValidLength'),
            // but extremely unlikely that a user would ever reach that limit naturally unless intentionally trying to break the extension
            return localize('invalidInputLength', 'A valid input value is required to proceed.');
        } else if (lowerLimitIncl && !upperLimitIncl) {
            return localize('inputLengthTooShort', 'The input value must be {0} characters or greater.', lowerLimitIncl);
        } else if (!lowerLimitIncl && upperLimitIncl) {
            return localize('inputLengthTooLong', 'The input value must be {0} characters or less.', upperLimitIncl);
        } else {
            return localize('invalidBetweenInputLength', 'The input value must be between {0} and {1} characters long.', lowerLimitIncl, upperLimitIncl);
        }
    }

    /**
     * Validates that the given input string consists of lower case alphanumeric characters,
     * starts and ends with an alphanumeric character, and does not contain any special symbols not explicitly specified
     *
     * @param value The original input string to validate
     * @param symbols Any custom symbols that are also allowed in the input string. Defaults to '-'.
     * @param canSymbolsRepeat A boolean specifying whether or not repeating or consecutive symbols are allowed
     *
     * @example
     * "abcd-1234" // returns true
     * "-abcd-1234" // returns false
     */
    export function isLowerCaseAlphanumericWithSymbols(value: string, symbols: string = '-', canSymbolsRepeat?: boolean): boolean {
        // Search through the passed symbols and match any allowed symbols
        // If we find a match, escape the symbol using '\\$&'
        const symbolPattern: string = symbols.replace(new RegExp(allowedSymbols, 'g'), '\\$&');
        const pattern: RegExp = new RegExp(`^[a-z0-9](?:[a-z0-9${symbolPattern}]*[a-z0-9])?$`);
        const symbolsRepeatPattern: RegExp = new RegExp('[^a-z0-9]{2}', 'g');
        return pattern.test(value) && (!!canSymbolsRepeat || !symbolsRepeatPattern.test(value));
    }

    /**
     * @param symbols Any custom symbols that are also allowed in the input string. Defaults to '-'.
     * @param canSymbolsRepeat A boolean specifying whether or not repeating or consecutive symbols are allowed
     */
    export function getInvalidLowerCaseAlphanumericWithSymbolsMessage(symbols: string = '-', canSymbolsRepeat?: boolean): string {
        const nonConsecutive: string = canSymbolsRepeat ? '' : localize('nonConsecutive', 'non-consecutive ');
        return localize('invalidLowerAlphanumericWithSymbols', `A name must consist of lower-case alphanumeric characters or the following {0}symbols: "{1}", and must start and end with a lower case alphanumeric character.`, nonConsecutive, symbols);
    }
}
