/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode, type ScaleRule } from "@azure/arm-appcontainers";
import { nonNullProp } from "@microsoft/vscode-azext-utils";
import { ScaleRuleTypes } from "../../../constants";
import { ext } from "../../../extensionVariables";
import type { RevisionsItemModel } from "../../../tree/revisionManagement/RevisionItem";
import { localize } from "../../../utils/localize";
import { RevisionDraftUpdateBaseStep } from "../../revisionDraft/RevisionDraftUpdateBaseStep";
import type { IAddScaleRuleContext } from "./IAddScaleRuleContext";

export class AddScaleRuleStep<T extends IAddScaleRuleContext> extends RevisionDraftUpdateBaseStep<T> {
    public priority: number = 200;

    constructor(baseItem: RevisionsItemModel) {
        super(baseItem);
    }

    public async execute(context: IAddScaleRuleContext): Promise<void> {
        this.revisionDraftTemplate.scale ||= {};
        this.revisionDraftTemplate.scale.rules ||= [];

        context.scaleRule = this.buildRule(context);
        this.integrateRule(context, this.revisionDraftTemplate.scale.rules, context.scaleRule);
        this.updateRevisionDraftWithTemplate();

        const resourceName = context.containerApp.revisionsMode === KnownActiveRevisionsMode.Single ? context.containerApp.name : this.baseItem.revision.name;
        ext.outputChannel.appendLog(localize('addedScaleRule', 'Added {0} rule "{1}" to "{2}" (draft)', context.newRuleType, context.newRuleName, resourceName));
    }

    public shouldExecute(context: IAddScaleRuleContext): boolean {
        return !!context.newRuleName && !!context.newRuleType;
    }

    private buildRule(context: IAddScaleRuleContext): ScaleRule {
        const scaleRule: ScaleRule = { name: context.newRuleName };
        switch (context.newRuleType) {
            case ScaleRuleTypes.HTTP:
                scaleRule.http = {
                    metadata: {
                        concurrentRequests: nonNullProp(context, 'newHttpConcurrentRequests')
                    }
                };
                break;
            case ScaleRuleTypes.Queue:
                scaleRule.azureQueue = {
                    queueName: context.newQueueName,
                    queueLength: context.newQueueLength,
                    auth: [{ secretRef: context.newQueueSecretRef, triggerParameter: context.newQueueTriggerParameter }]
                }
                break;
            default:
        }
        return scaleRule;
    }

    private integrateRule(context: IAddScaleRuleContext, scaleRules: ScaleRule[], scaleRule: ScaleRule): void {
        switch (context.newRuleType) {
            case ScaleRuleTypes.HTTP:
                // Portal only allows one HTTP rule per revision
                const idx: number = scaleRules.findIndex((rule) => rule.http);
                if (idx !== -1) {
                    scaleRules.splice(idx, 1);
                }
                break;
            case ScaleRuleTypes.Queue:
            default:
        }
        scaleRules.push(scaleRule);
    }
}


