/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ScaleRule, Template } from "@azure/arm-appcontainers";
import { AzureWizardExecuteStep, nonNullProp } from "@microsoft/vscode-azext-utils";
import { Progress, ProgressLocation, window } from "vscode";
import { ScaleRuleTypes } from "../../../constants";
import { ext } from "../../../extensionVariables";
import { localize } from "../../../utils/localize";
import { updateContainerApp } from "../../updateContainerApp";
import { IAddScaleRuleWizardContext } from "./IAddScaleRuleWizardContext";

export class AddScaleRuleStep extends AzureWizardExecuteStep<IAddScaleRuleWizardContext> {
    public priority: number = 100;

    public async execute(context: IAddScaleRuleWizardContext, _progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const adding = localize('addingScaleRule', 'Adding {0} rule to "{1}"...', context.ruleType, context.containerApp.name);
        const added = localize('addedScaleRule', 'Added {0} rule to "{1}".', context.ruleType, context.containerApp.name);

        const template: Template = context.containerApp.data.template || {};
        template.scale ||= {};
        template.scale.rules ||= [];

        const scaleRule: ScaleRule = this.buildScaleRule(context);
        this.integrateScaleRule(context, template.scale.rules, scaleRule);

        await window.withProgress({ location: ProgressLocation.Notification, title: adding }, async (): Promise<void> => {
            ext.outputChannel.appendLog(adding);
            await updateContainerApp(context, context.containerApp, { template });

            void window.showInformationMessage(added);
            ext.outputChannel.appendLog(added);

            await context.containerApp?.refresh(context);
        });
    }

    public shouldExecute(context: IAddScaleRuleWizardContext): boolean {
        return context.ruleName !== undefined && context.ruleType !== undefined;
    }

    private buildScaleRule(context: IAddScaleRuleWizardContext): ScaleRule {
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

    private integrateScaleRule(context: IAddScaleRuleWizardContext, scaleRules: ScaleRule[], scaleRule: ScaleRule): void {
        switch (context.ruleType) {
            case ScaleRuleTypes.HTTP:
                const idx: number = scaleRules.findIndex((rule) => rule.http);
                if (idx !== -1) {
                    scaleRules[idx] = scaleRule;
                }
                break;
            case ScaleRuleTypes.Queue:
            default:
        }
        scaleRules.push(scaleRule);
    }
}


