/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { KnownRunStatus, type Run as AcrRun } from '@azure/arm-containerregistry';
import { delay } from '../../../../utils/delay';
import { type BuildImageInAzureImageSourceContext } from './BuildImageInAzureImageSourceContext';

const WAIT_MS = 5000;

export async function buildImageInAzure(context: BuildImageInAzureImageSourceContext, runId: string): Promise<AcrRun | undefined> {
    const getRun = async () => context.client.runs.get(context.resourceGroupName, context.registryName, runId);

    let run = await getRun();
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
