/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { IActionContext, TreeElementBase, callWithTelemetryAndErrorHandling } from "@microsoft/vscode-azext-utils";
import type { ViewPropertiesModel } from "@microsoft/vscode-azureresources-api";
import * as gitUrlParse from "git-url-parse";
import { TreeItem, TreeItemCollapsibleState } from "vscode";
import type { ActionWorkflowRuns } from "../../gitHub/getActions";
import { GetJobsParams, Job, Jobs, getJobs } from "../../gitHub/getJobs";
import { Status, ensureStatus, getActionBasedIconPath } from '../../utils/actionUtils';
import { JobTreeItem } from "./JobTreeItem";

export class ActionTreeItem implements TreeElementBase {
    static contextValueCompleted: string = 'azureContainerActionCompleted';
    static contextValueInProgress: string = 'azureContainerActionInProgress';

    constructor(readonly parentResourceId: string, readonly actionWorkflowRuns: ActionWorkflowRuns) { }

    id: string = `${this.parentResourceId}/${this.actionWorkflowRuns.id}`;

    label: string = this.actionWorkflowRuns.head_commit?.message || this.actionWorkflowRuns.head_sha;

    viewProperties: ViewPropertiesModel = {
        data: this.actionWorkflowRuns,
        label: this.label,
    }

    getTreeItem(): TreeItem {
        return {
            id: this.id,
            label: this.label,
            description: this.actionWorkflowRuns.event,
            iconPath: getActionBasedIconPath(this.actionWorkflowRuns),
            contextValue: ensureStatus(this.actionWorkflowRuns) === Status.Completed ? ActionTreeItem.contextValueCompleted : ActionTreeItem.contextValueInProgress,
            collapsibleState: TreeItemCollapsibleState.Collapsed
        };
    }

    async getChildren(): Promise<TreeElementBase[]> {
        const jobsData: Jobs | undefined = await callWithTelemetryAndErrorHandling('getActionChildren', async (context: IActionContext) => {
            const { owner, name: repo } = gitUrlParse(this.actionWorkflowRuns.repository.html_url);
            const getJobsParams: GetJobsParams = {
                owner,
                repo,
                run_id: this.actionWorkflowRuns.id
            };
            return await getJobs(context, getJobsParams);
        });

        if (jobsData && jobsData.total_count > 0) {
            return jobsData.jobs.map((job: Job) => new JobTreeItem(this.id, job));
        } else {
            return [];
        }
    }
}
