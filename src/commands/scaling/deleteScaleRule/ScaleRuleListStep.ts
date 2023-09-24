/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ScaleRule } from "@azure/arm-appcontainers";
import { AzureWizardPromptStep, IAzureQuickPickItem, nonNullProp, nonNullValue } from "@microsoft/vscode-azext-utils";
import { localize } from "../../../utils/localize";
import { IDeleteScaleRuleContext } from "./IDeleteScaleRuleContext";

export class ScaleRuleListStep extends AzureWizardPromptStep<IDeleteScaleRuleContext> {
    public async prompt(context: IDeleteScaleRuleContext): Promise<void> {
        context.scaleRule = (await context.ui.showQuickPick(this.getPicks(context), { placeHolder: localize('scaleRule', 'Select a Scale Rule') })).data;
    }

    public shouldPrompt(context: IDeleteScaleRuleContext): boolean {
        return !context.scaleRule;
    }

    private async getPicks(context: IDeleteScaleRuleContext): Promise<IAzureQuickPickItem<ScaleRule>[] | undefined> {
        const scaleRules = context.containerApp?.template?.scale?.rules;
        if (scaleRules === undefined) {
            return undefined; // No resources found may change
        }
        else {
            return scaleRules?.map(r => {
                return {
                    label: nonNullProp(r, 'name'),
                    data: nonNullValue(r)
                }
            })
        }
    }
}
