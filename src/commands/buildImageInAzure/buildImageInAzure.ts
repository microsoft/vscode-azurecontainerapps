/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import type { Run as AcrRun } from '@azure/arm-containerregistry';
import { delay } from "@azure/ms-rest-js";
import { IBuildImageContext } from "./IBuildImageContext";
import { scheduleRunRequest } from "./scheduleRunRequest";

const WAIT_MS = 5000;

export async function buildImageInAzure(context: IBuildImageContext): Promise<AcrRun | undefined> {
    const getRun = await scheduleRunRequest(context);

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
