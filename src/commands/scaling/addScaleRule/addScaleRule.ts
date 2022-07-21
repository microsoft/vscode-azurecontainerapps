/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizard, IActionContext, IWizardOptions } from "@microsoft/vscode-azext-utils";
import { ext } from "../../../extensionVariables";
import { ScaleRuleGroupTreeItem } from "../../../tree/ScaleRuleGroupTreeItem";
import { AddNewScaleRule } from "./AddNewScaleRule";
import { GetScaleRuleNameStep } from "./GetScaleRuleNameStep";
import { GetScaleRuleTypeStep } from "./GetScaleRuleTypeStep";
import { IAddScaleRuleWizardContext } from "./IAddScaleRuleWizardContext";

export async function addScaleRule(context: IActionContext, node?: ScaleRuleGroupTreeItem): Promise<void> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<ScaleRuleGroupTreeItem>(new RegExp(ScaleRuleGroupTreeItem.contextValue), context);
    }

    const wizardContext: IAddScaleRuleWizardContext = {
        ...context, treeItem: node
    };
    const wizardOptions: IWizardOptions<IAddScaleRuleWizardContext> = {
        promptSteps: [new GetScaleRuleNameStep(), new GetScaleRuleTypeStep()],
        executeSteps: [new AddNewScaleRule()],
    };
    const wizard: AzureWizard<IAddScaleRuleWizardContext> = new AzureWizard(wizardContext, wizardOptions);
    await wizard.prompt();
    await wizard.execute();
}
