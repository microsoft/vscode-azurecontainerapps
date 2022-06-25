/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { parseError } from "@microsoft/vscode-azext-utils";

export async function deleteUtil(deleteFunction: () => Promise<void>): Promise<void> {
    try {
        await deleteFunction();
    } catch (error) {
        const pError = parseError(error);
        // a 204 indicates a success, but sdk is catching it as an exception
        // accept any 2xx reponse code
        if (Number(pError.errorType) < 200 || Number(pError.errorType) >= 300) {
            throw error;
        }

        // cast this for now because parseError doesn't get the status code if there is a message
        const e = error as { statusCode: number }
        if (Number(e.statusCode) < 200 || Number(e.statusCode) >= 300) {
            throw error;
        }
    }
}
