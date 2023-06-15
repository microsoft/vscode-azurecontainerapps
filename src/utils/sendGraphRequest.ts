/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { PipelineResponse, createHttpHeaders } from "@azure/core-rest-pipeline";
import { AzExtRequestPrepareOptions, sendRequestWithTimeout } from "@microsoft/vscode-azext-azureutils";
import { IActionContext } from "@microsoft/vscode-azext-utils";
import { AuthenticationGetSessionOptions, AuthenticationSession, authentication } from "vscode";
import { localize } from "./localize";

export type GraphRequestOptions = Omit<AzExtRequestPrepareOptions, 'headers'>;

export async function sendGraphRequest(context: IActionContext, requestOptions: GraphRequestOptions): Promise<PipelineResponse> {
    const scopes: string[] = ['https://graph.microsoft.com/.default'];
    const sessionOptions: AuthenticationGetSessionOptions = {
        clearSessionPreference: false,
        createIfNone: true
    };
    const session: AuthenticationSession | undefined = await authentication.getSession('microsoft', scopes, sessionOptions);

    if (!session) {
        throw new Error(localize('notSignedIn', 'You are not signed in to a valid Microsoft Graph account. Please sign in and try again.'));
    }

    const options: AzExtRequestPrepareOptions = {
        ...requestOptions,
        headers: createHttpHeaders({
            authorization: `Bearer ${session.accessToken}`
        })
    };

    return sendRequestWithTimeout(context, options, 10000, undefined);
}
