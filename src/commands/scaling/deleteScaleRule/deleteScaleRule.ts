/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/
import { Revision } from "@azure/arm-appcontainers";
import { AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, DeleteConfirmationStep, IActionContext, createSubscriptionContext } from "@microsoft/vscode-azext-utils";
import { ContainerAppModel } from "../../../tree/ContainerAppItem";
import { ScaleRuleGroupItem } from "../../../tree/scaling/ScaleRuleGroupItem";
import { ScaleRuleItem } from "../../../tree/scaling/ScaleRuleItem";
import { createActivityContext } from "../../../utils/activityUtils";
import { localize } from "../../../utils/localize";
import { pickScaleRuleGroup } from "../../../utils/pickItem/pickScale";
import { getParentResource } from "../../../utils/revisionDraftUtils";
import { DeleteScaleRuleStep } from "./DeleteScaleRuleStep";
import { IDeleteScaleRuleContext } from "./IDeleteScaleRuleContext";
import { ScaleRuleListStep } from "./ScaleRuleListStep";

export async function deleteScaleRule(context: IActionContext, node?: ScaleRuleItem): Promise<void> {
    const item: ScaleRuleGroupItem | ScaleRuleItem = node ?? await pickScaleRuleGroup(context, { autoSelectDraft: true });
    const { subscription, containerApp, revision } = item;

    const parentResource: ContainerAppModel | Revision = getParentResource(containerApp, revision);

    const wizardContext: IDeleteScaleRuleContext = {
        ...context,
        ...createSubscriptionContext(subscription),
        ...await createActivityContext(),
        containerApp,
        subscription
    }

    const confirmMessage = localize('confirmMessage', 'Are you sure you want to delete this scale rule?');

    const promptSteps: AzureWizardPromptStep<IDeleteScaleRuleContext>[] = [
        new ScaleRuleListStep(),
        new DeleteConfirmationStep(confirmMessage)
    ];

    wizardContext.scaleRule = node?.scaleRule;

    const executeSteps: AzureWizardExecuteStep<IDeleteScaleRuleContext>[] = [new DeleteScaleRuleStep(item)]

    const wizard: AzureWizard<IDeleteScaleRuleContext> = new AzureWizard(wizardContext, {
        title: localize('deleteScaleRuleTitle', 'Delete scale rule from container app "{0}" (draft)', containerApp.name),
        promptSteps,
        executeSteps,
        showLoadingPrompt: true
    });

    await wizard.prompt();
    wizardContext.activityTitle = localize('deleteScaleRuleTitle', 'Delete rule "{0}" from "{1}" (draft)', wizardContext.scaleRule?.name, parentResource.name);
    await wizard.execute();
}
