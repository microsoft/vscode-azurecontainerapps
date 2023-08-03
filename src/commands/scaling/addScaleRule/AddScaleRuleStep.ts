/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode, type ScaleRule } from "@azure/arm-appcontainers";
import { nonNullProp } from "@microsoft/vscode-azext-utils";
import type { Progress } from "vscode";
import { ScaleRuleTypes } from "../../../constants";
import { ext } from "../../../extensionVariables";
import type { RevisionsItemModel } from "../../../tree/revisionManagement/RevisionItem";
import { delay } from "../../../utils/delay";
import { localize } from "../../../utils/localize";
import { RevisionDraftUpdateBaseStep } from "../../revisionDraft/RevisionDraftUpdateBaseStep";
import type { IAddScaleRuleContext } from "./IAddScaleRuleContext";

export class AddScaleRuleStep<T extends IAddScaleRuleContext> extends RevisionDraftUpdateBaseStep<T> {
    public priority: number = 200;

    constructor(baseItem: RevisionsItemModel) {
        super(baseItem);
    }

    public async execute(context: IAddScaleRuleContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        let adding: string | undefined;
        let added: string | undefined;
        if (context.containerApp.revisionsMode === KnownActiveRevisionsMode.Single) {
            adding = localize('addingScaleRuleSingle', 'Add {0} rule "{1}" to container app "{2}" (draft)', context.ruleType, context.ruleName, context.containerApp.name);
            added = localize('addedScaleRuleSingle', 'Added {0} rule "{1}" to container app "{2}" (draft).', context.ruleType, context.ruleName, context.containerApp.name);
        } else {
            adding = localize('addingScaleRuleMultiple', 'Add {0} rule "{1}" to revision "{2}" (draft)', context.ruleType, context.ruleName, this.baseItem.revision.name);
            added = localize('addedScaleRuleMultiple', 'Added {0} rule "{1}" to revision "{2}" (draft)', context.ruleType, context.ruleName, this.baseItem.revision.name);
        }

        context.activityTitle = adding;
        progress.report({ message: localize('addingRule', 'Adding scale rule...') });

        this.revisionDraftTemplate.scale ||= {};
        this.revisionDraftTemplate.scale.rules ||= [];

        const scaleRule: ScaleRule = this.buildRule(context);
        this.integrateRule(context, this.revisionDraftTemplate.scale.rules, scaleRule);
        this.updateRevisionDraftWithTemplate();

        // Artificial delay to make the activity log look like it's performing an action
        await delay(1000);

        ext.outputChannel.appendLog(added);
    }

    public shouldExecute(context: IAddScaleRuleContext): boolean {
        return !!context.ruleName && !!context.ruleType;
    }

    private buildRule(context: IAddScaleRuleContext): ScaleRule {
        const scaleRule: ScaleRule = { name: context.ruleName };
        switch (context.ruleType) {
            case ScaleRuleTypes.HTTP:
                scaleRule.http = {
                    metadata: {
                        concurrentRequests: nonNullProp(context, 'concurrentRequests')
                    }
                };
                break;
            case ScaleRuleTypes.Queue:
                scaleRule.azureQueue = {
                    queueName: context.queueName,
                    queueLength: context.queueLength,
                    auth: [{ secretRef: context.existingSecretName, triggerParameter: context.triggerParameter }]
                }
                break;
            default:
        }
        return scaleRule;
    }

    private integrateRule(context: IAddScaleRuleContext, scaleRules: ScaleRule[], scaleRule: ScaleRule): void {
        switch (context.ruleType) {
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


