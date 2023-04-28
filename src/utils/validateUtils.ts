/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize } from "./localize";

export namespace validateUtils {
    const thirtyTwoBitMaxSafeInteger: number = 2147483647;
    // Estimated using UTF-8 encoding, where a character can be up to ~4 bytes long
    const maxSafeCharacterLength: number = thirtyTwoBitMaxSafeInteger / 32;

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
}
