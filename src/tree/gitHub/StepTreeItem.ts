/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { TreeElementBase } from "@microsoft/vscode-azext-utils";
import { ViewPropertiesModel } from "@microsoft/vscode-azureresources-api";
import { TreeItem } from "vscode";
import { JobStep } from "../../gitHub/getJobs";
import { getActionBasedIconPath, getJobBasedDescription } from '../../utils/actionUtils';

export class StepTreeItem implements TreeElementBase {
    static contextValue: string = 'azureContainerStep';

    constructor(readonly parentResourceId: number, readonly step: JobStep) { }

    id: string = `${this.parentResourceId}/${this.step.number}`;

    label: string = this.step.name;

    viewProperties: ViewPropertiesModel = {
        data: this.step,
        label: this.step.name,
    };

    getTreeItem(): TreeItem {
        return {
            id: this.id,
            label: this.label,
            description: getJobBasedDescription(this.step),
            iconPath: getActionBasedIconPath(this.step),
            contextValue: StepTreeItem.contextValue
        };
    }
}
