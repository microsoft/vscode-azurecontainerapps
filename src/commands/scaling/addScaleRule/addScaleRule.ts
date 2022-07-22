/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizard, IActionContext, IWizardOptions } from "@microsoft/vscode-azext-utils";
import { ext } from "../../../extensionVariables";
import { ScaleRuleGroupTreeItem } from "../../../tree/ScaleRuleGroupTreeItem";
import { localize } from "../../../utils/localize";
import { AddScaleRuleStep } from "./AddScaleRuleStep";
import { IAddScaleRuleWizardContext } from "./IAddScaleRuleWizardContext";
import { ScaleRuleNameStep } from "./ScaleRuleNameStep";
import { ScaleRuleTypeStep } from "./ScaleRuleTypeStep";

export async function addScaleRule(context: IActionContext, node?: ScaleRuleGroupTreeItem): Promise<void> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<ScaleRuleGroupTreeItem>(new RegExp(ScaleRuleGroupTreeItem.contextValue), context);
    }

    const title: string = localize('addScaleRuleTitle', 'Add Scale Rule');
    const wizardContext: IAddScaleRuleWizardContext = {
        ...context, treeItem: node
    };
    const wizardOptions: IWizardOptions<IAddScaleRuleWizardContext> = {
        title,
        promptSteps: [new ScaleRuleNameStep(), new ScaleRuleTypeStep()],
        executeSteps: [new AddScaleRuleStep()],
    };
    const wizard: AzureWizard<IAddScaleRuleWizardContext> = new AzureWizard(wizardContext, wizardOptions);
    await wizard.prompt();
    await wizard.execute();
}
