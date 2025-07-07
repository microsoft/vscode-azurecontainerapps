/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { nonNullValueAndProp } from "@microsoft/vscode-azext-utils";
import { ext } from "../../../../extensionVariables";
import { type RevisionsItemModel } from "../../../../tree/revisionManagement/RevisionItem";
import { localize } from "../../../../utils/localize";
import { getParentResourceFromItem } from "../../../../utils/revisionDraftUtils";
import { RevisionDraftUpdateBaseStep } from "../../../revisionDraft/RevisionDraftUpdateBaseStep";
import { type ScaleRuleContext } from "../ScaleRuleContext";

export class DeleteScaleRuleStep<T extends ScaleRuleContext> extends RevisionDraftUpdateBaseStep<T> {
    public priority: number = 100;

    constructor(baseItem: RevisionsItemModel) {
        super(baseItem);
    }

    public async execute(context: T): Promise<void> {
        this.revisionDraftTemplate.scale ||= {};
        this.revisionDraftTemplate.scale.rules ||= [];

        const index = this.revisionDraftTemplate.scale.rules.findIndex(r => r.name === nonNullValueAndProp(context.scaleRule, 'name'));
        this.revisionDraftTemplate.scale.rules.splice(index, 1);

        await this.updateRevisionDraftWithTemplate(context);

        const resourceName = getParentResourceFromItem(this.baseItem).name;
        ext.outputChannel.appendLog(localize('deletedScaleRule', 'Deleted rule "{0}" from "{1}" (draft)', context.scaleRule?.name, resourceName));
    }

    public shouldExecute(context: T): boolean {
        return !!context.scaleRule;
    }
}
