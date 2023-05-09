/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { TreeItemIconPath, nonNullProp } from "@microsoft/vscode-azext-utils";
import * as dayjs from "dayjs";
// eslint-disable-next-line import/no-internal-modules
import * as relativeTime from 'dayjs/plugin/relativeTime';
import { ThemeColor, ThemeIcon } from "vscode";
import { ActionWorkflowRuns } from "../gitHub/getActions";
import { Job, JobStep } from "../gitHub/getJobs";
import { localize } from "./localize";

dayjs.extend(relativeTime);

/**
 * 'actionUtils' logic heavily-adapted from SWA: https://github.com/microsoft/vscode-azurestaticwebapps/blob/main/src/utils/actionUtils.ts
 * Code provided is a good candidate for inclusion in the upcoming GitHub shared package
 */

// https://developer.github.com/v3/checks/runs/#parameters
export enum Conclusion {
    Success = 'success',
    Failure = 'failure',
    Skipped = 'skipped',
    Cancelled = 'cancelled'
}

export enum Status {
    Queued = 'queued',
    InProgress = 'in_progress',
    Completed = 'completed'
}

// Description
export function getJobBasedDescription(data: Job | JobStep): string {
    if (data.conclusion !== null) {
        return localize('conclusionDescription', '{0} {1}', convertConclusionToVerb(<Conclusion>nonNullProp(data, 'conclusion')), dayjs(data.completed_at).fromNow());
    } else {
        const nowStr: string = localize('now', 'now');
        return localize('statusDescription', '{0} {1}', convertStatusToVerb(<Status>nonNullProp(data, 'status')), !data.started_at ? nowStr : dayjs(data.started_at).fromNow());
    }
}

// Icon Path
export function getActionBasedIconPath(data: ActionWorkflowRuns | Job | JobStep): TreeItemIconPath {
    let id: string;
    let colorId: string | undefined;
    if (data.conclusion !== null) {
        switch (<Conclusion>nonNullProp(data, 'conclusion')) {
            case Conclusion.Cancelled:
                id = 'circle-slash';
                colorId = 'testing.iconUnset';
                break;
            case Conclusion.Failure:
                id = 'error';
                colorId = 'testing.iconFailed';
                break;
            case Conclusion.Skipped:
                id = 'debug-step-over';
                colorId = 'testing.iconSkipped';
                break;
            case Conclusion.Success:
                id = 'pass'
                colorId = 'testing.iconPassed';
                break;
        }
    } else {
        switch (<Status>nonNullProp(data, 'status')) {
            case Status.Queued:
                id = 'clock';
                colorId = 'testing.iconQueued';
                break;
            case Status.InProgress:
                id = 'play-circle';
                colorId = 'testing.iconUnset';
                break;
            case Status.Completed:
                id = 'pass';
                colorId = 'testing.iconPassed';
                break;
        }
    }

    return new ThemeIcon(id, colorId ? new ThemeColor(colorId) : undefined);
}

// Helpers...
function convertConclusionToVerb(conclusion: Conclusion): string {
    switch (conclusion) {
        case Conclusion.Success:
            return localize('succeeded', 'succeeded');
        case Conclusion.Cancelled:
            return localize('cancelled', 'cancelled');
        case Conclusion.Failure:
            return localize('failed', 'failed');
        case Conclusion.Skipped:
            return localize('skipped', 'skipped');
        default:
            return '';
    }
}

function convertStatusToVerb(status: Status): string {
    switch (status) {
        case Status.InProgress:
            return localize('started', 'started');
        case Status.Queued:
            return localize('queued', 'queued');
        case Status.Completed:
            return localize('completed', 'completed');
        default:
            return '';
    }
}
