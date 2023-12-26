/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { getInvalidAlphanumericAndSymbolsMessageTest } from "./getInvalidAlphanumericAndSymbolsMessage.test";
import { hasValidAlphanumericAndSymbolsTest } from "./hasValidAlphanumericAndSymbols.test";

suite('validationUtils', () => {
    test('hasValidAlphanumericAndSymbols', hasValidAlphanumericAndSymbolsTest);
    test('getInvalidAlphanumericAndSymbolsMessage', getInvalidAlphanumericAndSymbolsMessageTest);
});
