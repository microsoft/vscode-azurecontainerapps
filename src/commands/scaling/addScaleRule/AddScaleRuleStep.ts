/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ScaleRule, Template } from "@azure/arm-appcontainers";
import { AzureWizardExecuteStep, nonNullProp } from "@microsoft/vscode-azext-utils";
import { Progress, window } from "vscode";
import { ScaleRuleTypes } from "../../../constants";
import { ext } from "../../../extensionVariables";
import { localize } from "../../../utils/localize";
import { updateContainerApp } from "../../deployContainerApp/updateContainerApp";
import { IAddScaleRuleContext } from "./IAddScaleRuleContext";

export class AddScaleRuleStep extends AzureWizardExecuteStep<IAddScaleRuleContext> {
    public priority: number = 100;

    public async execute(context: IAddScaleRuleContext, _progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const adding = localize('addingScaleRule', 'Adding {0} rule "{1}" to "{2}"...', context.ruleType, context.ruleName, context.containerApp.name);
        const added = localize('addedScaleRule', 'Successfully added {0} rule "{1}" to "{2}".', context.ruleType, context.ruleName, context.containerApp.name);

        const template: Template = context.containerApp.template || {};
        template.scale = context.scale || {};
        template.scale.rules = context.scaleRules || [];

        const scaleRule: ScaleRule = this.buildRule(context);
        this.integrateRule(context, template.scale.rules, scaleRule);

        ext.outputChannel.appendLog(adding);
        await updateContainerApp(context, context.subscription, context.containerApp, { template });
        context.scaleRule = scaleRule;
        void window.showInformationMessage(added);
        ext.outputChannel.appendLog(added);
    }

    public shouldExecute(context: IAddScaleRuleContext): boolean {
        return context.ruleName !== undefined && context.ruleType !== undefined;
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
                    auth: [{ secretRef: context.secretRef, triggerParameter: context.triggerParameter }]
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
                    scaleRules.splice(idx, 0);
                }
                break;
            case ScaleRuleTypes.Queue:
            default:
        }
        scaleRules.push(scaleRule);
    }
}


