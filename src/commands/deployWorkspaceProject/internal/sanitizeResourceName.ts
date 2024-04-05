/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Takes a name and sanitizes it such that it can be used to create an ACA resource and pass common input validation
 */
export function sanitizeResourceName(name: string): string {
    // Only alphanumeric characters or hyphens
    let sanitizedName: string = name.toLowerCase().replace(/[^a-z0-9-]+/g, '');

    // Remove any consecutive hyphens
    sanitizedName = sanitizedName.replace(/-+/g, '-');

    // Remove any leading or ending hyphens
    if (sanitizedName.startsWith('-')) {
        sanitizedName = sanitizedName.slice(1);
    }
    if (sanitizedName.endsWith('-')) {
        sanitizedName = sanitizedName.slice(0, -1);
    }

    return sanitizedName;
}
