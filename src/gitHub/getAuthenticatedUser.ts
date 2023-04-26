/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Octokit, RestEndpointMethodTypes } from "@octokit/rest";
import { IGitHubContext } from "./IGitHubContext";
import { createOctokitClient } from "./createOctokitClient";

export type AuthenticatedUser = RestEndpointMethodTypes["users"]["getAuthenticated"]["response"]["data"];

export async function getAuthenticatedUser(context: IGitHubContext): Promise<AuthenticatedUser> {
    const client: Octokit = await createOctokitClient(context);
    return (await client.users.getAuthenticated()).data;
}
