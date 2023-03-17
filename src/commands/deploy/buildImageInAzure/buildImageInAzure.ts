/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import type { Run as AcrRun } from '@azure/arm-containerregistry';
import { delay } from "@azure/ms-rest-js";
import { nonNullValue } from '@microsoft/vscode-azext-utils';
import { IBuildImageInAzureContext } from "./IBuildImageInAzureContext";

const WAIT_MS = 5000;

export async function buildImageInAzure(context: IBuildImageInAzureContext): Promise<AcrRun | undefined> {
    const getRun = async () => context.client.runs.get(context.resourceGroupName, context.registryName, nonNullValue(context.run.runId));

    let run = await getRun();
    const { KnownRunStatus } = await import('@azure/arm-containerregistry');
    while (
        run.status === KnownRunStatus.Started ||
        run.status === KnownRunStatus.Queued ||
        run.status === KnownRunStatus.Running
    ) {
        await delay(WAIT_MS);
        run = await getRun();
    }

    return run;
}
