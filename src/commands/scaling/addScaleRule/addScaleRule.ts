/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizard, IActionContext, IWizardOptions, nonNullProp, nonNullValue } from "@microsoft/vscode-azext-utils";
import { ext } from "../../../extensionVariables";
import { ContainerAppItem } from "../../../tree/ContainerAppItem";
import { ScaleRuleGroupItem } from "../../../tree/scaling/ScaleRuleGroupItem";
import { localize } from "../../../utils/localize";
import { AddScaleRuleStep } from "./AddScaleRuleStep";
import { IAddScaleRuleWizardContext } from "./IAddScaleRuleWizardContext";
import { ScaleRuleNameStep } from "./ScaleRuleNameStep";
import { ScaleRuleTypeStep } from "./ScaleRuleTypeStep";

export async function addScaleRule(context: IActionContext, node?: ContainerAppItem | ScaleRuleGroupItem): Promise<void> {
    if (!node) {
        // TODO: pick container app in single revision mode, or a revision
        throw new Error('Not implemented yet');
        // node = await ext.rgApi.pickAppResource<ScaleRuleGroupTreeItem>(context, {
        //     filter: rootFilter,
        //     expectedChildContextValue: new RegExp(ScaleRuleGroupTreeItem.contextValue)
        // });
    }

    const containerApp = node.containerApp;
    const scale = node instanceof ContainerAppItem ? node.containerApp.template?.scale : node.revision.template?.scale;
    const title: string = localize('addScaleRuleTitle', 'Add Scale Rule');

    const wizardContext: IAddScaleRuleWizardContext = {
        ...context,
        scale: nonNullValue(scale),
        subscription: node.subscription,
        containerApp,
        scaleRules: scale?.rules ?? [],
    };

    const wizardOptions: IWizardOptions<IAddScaleRuleWizardContext> = {
        title,
        promptSteps: [new ScaleRuleNameStep(), new ScaleRuleTypeStep()],
        executeSteps: [new AddScaleRuleStep()],
        showLoadingPrompt: true
    };

    const wizard: AzureWizard<IAddScaleRuleWizardContext> = new AzureWizard(wizardContext, wizardOptions);
    await wizard.prompt();

    // TODO: change to run with temporary child
    await ext.state.runWithTemporaryDescription(nonNullProp(node, 'id'), localize('creating', 'Creating...'), async () => {
        await wizard.execute();
        ext.state.notifyChildrenChanged(containerApp.managedEnvironmentId);
    });
}
