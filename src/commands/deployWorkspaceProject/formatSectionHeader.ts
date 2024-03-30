/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

/**
 * @returns Formatted text to look like a new section header for output channel display
 */
export function formatSectionHeader(text: string): string {
    return `--------${text}--------`;
}
