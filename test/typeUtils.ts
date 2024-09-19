/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Defines all object props to be either string or RegExp
 */
export type StringOrRegExpProps<T extends object> = {
    [Prop in keyof T]: string | RegExp;
};
