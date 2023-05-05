/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { Octokit, RestEndpointMethodTypes } from "@octokit/rest";
import type { IGitHubContext } from "./IGitHubContext";
import { createOctokitClient } from "./createOctokitClient";

export type Orgs = RestEndpointMethodTypes["orgs"]["listForAuthenticatedUser"]["response"]["data"];

export async function getOrgs(context: IGitHubContext): Promise<Orgs> {
    const client: Octokit = await createOctokitClient(context);
    return (await client.orgs.listForAuthenticatedUser()).data;
}
