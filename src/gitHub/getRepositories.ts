/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Octokit, RestEndpointMethodTypes } from "@octokit/rest";
import { IGitHubContext } from "./IGitHubContext";
import { createOctokitClient } from "./createOctokitClient";

export type UserRepos = RestEndpointMethodTypes["repos"]["listForAuthenticatedUser"]["response"]["data"];
export type GetUserReposReqParams = RestEndpointMethodTypes["repos"]["listForAuthenticatedUser"]["parameters"];

export async function getRepositoriesByUser(context: IGitHubContext, params?: GetUserReposReqParams): Promise<UserRepos> {
    const client: Octokit = await createOctokitClient(context);
    return (await client.repos.listForAuthenticatedUser(params)).data;
}

export type OrgRepos = RestEndpointMethodTypes["repos"]["listForOrg"]["response"]["data"];
export type GetOrgReposReqParams = RestEndpointMethodTypes["repos"]["listForOrg"]["parameters"];

export async function getRepositoriesByOrg(context: IGitHubContext, params?: GetOrgReposReqParams): Promise<OrgRepos> {
    const client: Octokit = await createOctokitClient(context);
    return (await client.repos.listForOrg(params)).data;
}
