/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AuthenticationProvider, Client, ClientOptions } from "@microsoft/microsoft-graph-client";
import "isomorphic-fetch"; // Requires importing this library or a fetch polyfill to use the graph client
import { AuthenticationGetSessionOptions, AuthenticationSession, authentication } from "vscode";
import { localize } from "./localize";

// Graph client is saved for the duration of the extension to prevent multiple login re-prompts
let client: Client | undefined;

export async function createGraphClient(): Promise<Client> {
    if (client) {
        return client;
    }

    const scopes: string[] = ['https://graph.microsoft.com/.default'];
    const sessionOptions: AuthenticationGetSessionOptions = {
        clearSessionPreference: true,
        createIfNone: true
    };
    const session: AuthenticationSession | undefined = await authentication.getSession('microsoft', scopes, sessionOptions);

    if (!session) {
        throw new Error(localize('notSignedIn', 'You are not signed in to a valid Microsoft Graph account. Please sign in and try again.'));
    }

    const authProvider: AuthenticationProvider = {
        // AuthenticationProvider expects 'getAccessToken' to return a Promise
        getAccessToken: (): Promise<string> => {
            return Promise.resolve(session.accessToken);
        }
    };
    const clientOptions: ClientOptions = {
        authProvider
    };

    client = Client.initWithMiddleware(clientOptions);
    return client;
}
