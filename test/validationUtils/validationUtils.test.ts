/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { getInvalidAlphanumericAndSymbolsMessageTest } from "./getInvalidAlphanumericAndSymbolsMessage.test";
import { gewtInvalidNumberFormatMessageTest } from "./getInvalidNumberFormatMessage.test";
import { hasValidAlphanumericAndSymbolsTest } from "./hasValidAlphanumericAndSymbols.test";
import { hasValidNumberFormatTest } from "./hasValidNumberFormat.test";

suite('validationUtils', () => {
    test('hasValidNumberRange', () => { /** Todo */ });
    test('getInvalidNumberRangeMessage', () => { /** Todo */ });
    test('hasValidCharLength', () => { /** Todo */ });
    test('getInvalidCharLengthMessage', () => { /** Todo */ });

    test('hasValidAlphanumericAndSymbols', hasValidAlphanumericAndSymbolsTest);
    test('getInvalidAlphanumericAndSymbolsMessage', getInvalidAlphanumericAndSymbolsMessageTest);
    test('hasValidNumberFormat', hasValidNumberFormatTest);
    test('getInvalidNumberFormatMessage', gewtInvalidNumberFormatMessageTest);
});
