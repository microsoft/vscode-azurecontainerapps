/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { nonNullProp } from "@microsoft/vscode-azext-utils";
import { ext } from "../../../extensionVariables";
import { type RevisionsItemModel } from "../../../tree/revisionManagement/RevisionItem";
import { localize } from "../../../utils/localize";
import { getParentResourceFromItem } from "../../../utils/revisionDraftUtils";
import { RevisionDraftUpdateBaseStep } from "../../revisionDraft/RevisionDraftUpdateBaseStep";
import { type ScaleRangeContext } from "./ScaleRangeContext";

export function shouldUpdateScaleRange(context: Pick<ScaleRangeContext, 'newMinRange' | 'newMaxRange' | 'scaleMinRange' | 'scaleMaxRange'>): boolean {
    return context.newMinRange !== undefined &&
        context.newMaxRange !== undefined &&
        (context.newMinRange !== context.scaleMinRange || context.newMaxRange !== context.scaleMaxRange);
}

export function shouldPreserveNullMinReplicas(context: Pick<ScaleRangeContext, 'newMinRange' | 'scaleMinRange' | 'wasMinReplicasNull'>): boolean {
    return context.wasMinReplicasNull === true && context.newMinRange === context.scaleMinRange;
}

export class ScaleRangeUpdateStep<T extends ScaleRangeContext> extends RevisionDraftUpdateBaseStep<T> {
    public priority: number = 1110;

    constructor(baseItem: RevisionsItemModel) {
        super(baseItem);
    }

    public async execute(context: T): Promise<void> {
        this.revisionDraftTemplate.scale ||= {};
        if (!shouldPreserveNullMinReplicas(context)) {
            this.revisionDraftTemplate.scale.minReplicas = context.newMinRange;
        }
        this.revisionDraftTemplate.scale.maxReplicas = context.newMaxRange;

        await this.updateRevisionDraftWithTemplate(context);

        context.scaleMinRange = nonNullProp(context, 'newMinRange');
        context.scaleMaxRange = nonNullProp(context, 'newMaxRange');

        const parentResourceName = getParentResourceFromItem(this.baseItem).name;
        ext.outputChannel.appendLog(localize('updatedScaleRange', 'Updated replica scaling range to {0}-{1} for "{2}".', context.newMinRange, context.newMaxRange, parentResourceName));
    }

    public shouldExecute(context: T): boolean {
        return shouldUpdateScaleRange(context);
    }
}
