/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Octokit, RestEndpointMethodTypes } from "@octokit/rest";
import { IGitHubContext } from "./IGitHubContext";
import { createOctokitClient } from "./createOctokitClient";

export type UserOrgs = RestEndpointMethodTypes["orgs"]["listForAuthenticatedUser"]["response"]["data"];

export async function getUserOrgs(context: IGitHubContext): Promise<UserOrgs> {
    const client: Octokit = await createOctokitClient(context);
    return (await client.orgs.listForAuthenticatedUser()).data;
}
