/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/
import { nonNullProp } from "@microsoft/vscode-azext-utils";
import { ext } from "../../../extensionVariables";
import { RevisionsItemModel } from "../../../tree/revisionManagement/RevisionItem";
import { localize } from "../../../utils/localize";
import { getParentResource } from "../../../utils/revisionDraftUtils";
import { RevisionDraftUpdateBaseStep } from "../../revisionDraft/RevisionDraftUpdateBaseStep";
import { IAddScaleRuleContext } from "../addScaleRule/IAddScaleRuleContext";
import { IDeleteScaleRuleContext } from "./IDeleteScaleRuleContext";

export class DeleteScaleRuleStep<T extends IAddScaleRuleContext> extends RevisionDraftUpdateBaseStep<T> {
    public priority: number = 160;

    constructor(baseItem: RevisionsItemModel) {
        super(baseItem);
    }

    public async execute(context: IDeleteScaleRuleContext): Promise<void> {
        this.revisionDraftTemplate.scale ||= {};
        this.revisionDraftTemplate.scale.rules ||= [];

        //remove the scale rule from the draft template
        //this.revisionDraftTemplate.scale.rules

        this.updateRevisionDraftWithTemplate();

        const resourceName = getParentResource(nonNullProp(context, 'containerApp'), this.baseItem.revision).name;
        ext.outputChannel.appendLog(localize('deletedScaleRule', 'Deleted rule "{1}" to "{2}" (draft)', context.scaleRule?.name, resourceName));

    }

    public shouldExecute(context: IDeleteScaleRuleContext): boolean {
        return !!context.scaleRule; //not sure about this
    }

}
