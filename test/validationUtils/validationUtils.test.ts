/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { getInvalidAlphanumericAndSymbolsMessageTest } from "./getInvalidAlphanumericAndSymbolsMessage.test";
import { getInvalidCharLengthMessageTest } from "./getInvalidCharLengthMessage.test";
import { getInvalidNumericFormatMessageTest } from "./getInvalidNumericFormatMessage.test";
import { getInvalidNumericValueMessageTest } from "./getInvalidNumericValueMessage.test";
import { hasValidAlphanumericAndSymbolsTest } from "./hasValidAlphanumericAndSymbols.test";
import { hasValidCharLengthTest } from "./hasValidCharLength.test";
import { hasValidNumericFormatTest } from "./hasValidNumericFormat.test";
import { isValidNumericValueTest } from "./isValidNumericValue.test";

suite('validationUtils', () => {
    // General
    test('hasValidCharLength', hasValidCharLengthTest);
    test('getInvalidCharLengthMessage', getInvalidCharLengthMessageTest);
    test('hasValidAlphanumericAndSymbols', hasValidAlphanumericAndSymbolsTest);
    test('getInvalidAlphanumericAndSymbolsMessage', getInvalidAlphanumericAndSymbolsMessageTest);

    // Numbers
    test('hasValidNumericFormat', hasValidNumericFormatTest);
    test('getInvalidNumericFormatMessage', getInvalidNumericFormatMessageTest);
    test('isValidNumericValue', isValidNumericValueTest);
    test('getInvalidNumericValueMessage', getInvalidNumericValueMessageTest);
});
