/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import deepEqual from 'deep-eql';

export function areTemplateValuesEqual(original: unknown, draft: unknown): boolean {
    // Draft JSON omits undefined properties returned by the SDK, including nested ones.
    const originalJson = original === undefined ? undefined : JSON.parse(JSON.stringify(original));
    const draftJson = draft === undefined ? undefined : JSON.parse(JSON.stringify(draft));
    return deepEqual(originalJson, draftJson);
}
