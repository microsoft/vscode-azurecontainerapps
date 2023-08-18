/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createContextValue } from "@microsoft/vscode-azext-utils";
import { randomUUID } from "crypto";

export function createActivityChildContext(stepOrder: number, contextValues: string[]): string {
    // Add randomUUID because contexts need to be original
    return `${stepOrder};` + createContextValue(contextValues) + `;${randomUUID()}`;
}
