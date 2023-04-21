/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Octokit, RestEndpointMethodTypes } from "@octokit/rest";
import { IGitHubContext } from "./IGitHubContext";
import { createOctokitClient } from "./createOctokitClient";

export type Branches = RestEndpointMethodTypes["repos"]["listBranches"]["response"]["data"];
export type GetBranchesParams = RestEndpointMethodTypes["repos"]["listBranches"]["parameters"];

export async function getBranches(context: IGitHubContext, params?: GetBranchesParams): Promise<Branches> {
    const client: Octokit = await createOctokitClient(context);
    return (await client.repos.listBranches(params)).data;
}
