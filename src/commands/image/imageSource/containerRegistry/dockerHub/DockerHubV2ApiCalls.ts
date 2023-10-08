/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzExtPipelineResponse, sendRequestWithTimeout } from "@microsoft/vscode-azext-azureutils";
import { IActionContext } from "@microsoft/vscode-azext-utils";
import { DockerHubV2ApiResponse, DockerHubV2Repository, DockerHubV2Tags } from "./DockerHubV2Types";

export async function getReposForNamespace(context: IActionContext, namespace: string, nextUrl?: string | null): Promise<DockerHubV2ApiResponse<DockerHubV2Repository>> {
    const url = nextUrl || `https://hub.docker.com/v2/repositories/${namespace}`;
    return <DockerHubV2ApiResponse<DockerHubV2Repository>>(<AzExtPipelineResponse>await sendRequestWithTimeout(context, { url, method: 'GET' }, 5000, undefined)).parsedBody;
}

export async function getTagsForRepo(context: IActionContext, namespace: string, name: string, nextUrl?: string | null): Promise<DockerHubV2ApiResponse<DockerHubV2Tags>> {
    const url = nextUrl || `https://hub.docker.com/v2/repositories/${namespace}/${name}/tags`;
    return <DockerHubV2ApiResponse<DockerHubV2Tags>>(<AzExtPipelineResponse>await sendRequestWithTimeout(context, { url, method: 'GET' }, 5000, undefined)).parsedBody;
}
