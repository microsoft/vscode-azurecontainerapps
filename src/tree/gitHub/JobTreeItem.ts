/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ViewPropertiesModel } from "@microsoft/vscode-azureresources-api";
import { TreeItem, TreeItemCollapsibleState } from "vscode";
import { Job } from "../../gitHub/getJobs";
import { getActionBasedIconPath, getJobBasedDescription } from '../../utils/actionUtils';
import type { TreeElementBase } from "../ContainerAppsBranchDataProvider";
import { StepTreeItem } from "./StepTreeItem";

export class JobTreeItem implements TreeElementBase {
    static contextValue: string = 'azureContainerJob';

    constructor(readonly job: Job) { }

    id: string = String(this.job.id);

    label: string = this.job.name || this.id;

    viewProperties: ViewPropertiesModel = {
        data: this.job,
        label: this.label,
    };

    getTreeItem(): TreeItem {
        return {
            id: this.id,
            label: this.label,
            description: getJobBasedDescription(this.job),
            iconPath: getActionBasedIconPath(this.job),
            contextValue: JobTreeItem.contextValue,
            collapsibleState: TreeItemCollapsibleState.Collapsed,
        };
    }

    async getChildren(): Promise<TreeElementBase[]> {
        return this.job.steps?.map((step) => new StepTreeItem(this.job.id, step)) ?? [];
    }
}
