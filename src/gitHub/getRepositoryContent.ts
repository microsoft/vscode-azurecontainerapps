/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { Octokit, RestEndpointMethodTypes } from "@octokit/rest";
import type { IGitHubContext } from "./IGitHubContext";
import { createOctokitClient } from "./createOctokitClient";

export type RepoContent = RestEndpointMethodTypes["repos"]["getContent"]["response"]["data"];
export type GetRepoContentReqParams = RestEndpointMethodTypes["repos"]["getContent"]["parameters"];

export async function getRepositoryContent(context: IGitHubContext, reqParams?: GetRepoContentReqParams): Promise<RepoContent> {
    const client: Octokit = await createOctokitClient(context);
    return (await client.repos.getContent(reqParams)).data;
}
