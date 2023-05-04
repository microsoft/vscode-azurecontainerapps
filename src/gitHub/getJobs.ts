/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Octokit, RestEndpointMethodTypes } from "@octokit/rest";
import { IGitHubContext } from "./IGitHubContext";
import { createOctokitClient } from "./createOctokitClient";

export type Jobs = RestEndpointMethodTypes["actions"]["listJobsForWorkflowRun"]["response"]["data"];
export type Job = Jobs["jobs"][number];
export type JobStep = NonNullable<Job["steps"]>[number];

export type GetJobsParams = RestEndpointMethodTypes["actions"]["listJobsForWorkflowRun"]["parameters"];

export async function getJobs(context: IGitHubContext, params: GetJobsParams): Promise<Jobs> {
    const client: Octokit = await createOctokitClient(context);
    return (await client.actions.listJobsForWorkflowRun(params)).data;
}
