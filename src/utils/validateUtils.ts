/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize } from "./localize";

export namespace validateUtils {
    const thirtyTwoBitMaxSafeInteger: number = 2147483647;

    /**
     * Validates that the given input string is the appropriate length as determined by the optional lower and upper limit parameters
     */
    export function isValidLength(value: string, lowerLimitIncl?: number, upperLimitIncl?: number): boolean {
        // Estimated using the following: VS Code typically defaults to UTF-8; so a character can be encoded to be up to ~4 bytes long
        const maxSafeLength: number = thirtyTwoBitMaxSafeInteger / 32;

        lowerLimitIncl ??= 1;
        upperLimitIncl = (!upperLimitIncl || upperLimitIncl > maxSafeLength) ? maxSafeLength : upperLimitIncl;

        if (lowerLimitIncl > upperLimitIncl || value.length < lowerLimitIncl || value.length > upperLimitIncl) {
            return false;
        } else {
            return true;
        }
    }

    /**
     * Corresponding message for when 'isValidLength' returns false.  Provides a message that can be used to inform the user of the length requirements
     */
    export function getInvalidLengthMessage (lowerLimitIncl?: number, upperLimitIncl?: number): string {
        if (!lowerLimitIncl && !upperLimitIncl) {
            return localize('invalidInputLength', "The value's length is invalid.");
        } else if (lowerLimitIncl && !upperLimitIncl) {
            return localize('inputLengthTooShort', 'The value must be {0} or greater.', lowerLimitIncl);
        } else if (!lowerLimitIncl && upperLimitIncl) {
            return localize('inputLengthTooLong', 'The value must be {0} or less.', upperLimitIncl);
        } else {
            return localize('invalidBetweenInputLength', 'The value must be between {0} and {1} characters long.', lowerLimitIncl, upperLimitIncl);
        }
    }
}
