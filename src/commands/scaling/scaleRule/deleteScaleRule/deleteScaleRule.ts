/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/
import type { Revision } from "@azure/arm-appcontainers";
import { AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, DeleteConfirmationStep, IActionContext, createSubscriptionContext } from "@microsoft/vscode-azext-utils";
import type { ContainerAppModel } from "../../../../tree/ContainerAppItem";
import type { ScaleRuleGroupItem } from "../../../../tree/scaling/ScaleRuleGroupItem";
import type { ScaleRuleItem } from "../../../../tree/scaling/ScaleRuleItem";
import { createActivityContext } from "../../../../utils/activity/activityUtils";
import { localize } from "../../../../utils/localize";
import { pickScaleRuleGroup } from "../../../../utils/pickItem/pickScale";
import { getParentResource, showRevisionDraftDeployPopup } from "../../../../utils/revisionDraftUtils";
import type { ScaleRuleContext } from "../ScaleRuleContext";
import { ScaleRuleListStep } from "../ScaleRuleListStep";
import { DeleteScaleRuleStep } from "./DeleteScaleRuleStep";

export async function deleteScaleRule(context: IActionContext, node?: ScaleRuleItem): Promise<void> {
    const item: ScaleRuleGroupItem | ScaleRuleItem = node ?? await pickScaleRuleGroup(context, { autoSelectDraft: true });
    const { subscription, containerApp, revision } = item;

    const parentResource: ContainerAppModel | Revision = getParentResource(containerApp, revision);

    const wizardContext: ScaleRuleContext = {
        ...context,
        ...createSubscriptionContext(subscription),
        ...await createActivityContext(),
        containerApp,
        subscription,
        scaleRule: node?.scaleRule
    }

    const confirmMessage = localize('confirmMessage', 'Are you sure you want to delete this scale rule?');

    const promptSteps: AzureWizardPromptStep<ScaleRuleContext>[] = [
        new ScaleRuleListStep(),
        new DeleteConfirmationStep(confirmMessage)
    ];

    const executeSteps: AzureWizardExecuteStep<ScaleRuleContext>[] = [new DeleteScaleRuleStep(item)]

    const wizard: AzureWizard<ScaleRuleContext> = new AzureWizard(wizardContext, {
        title: localize('deleteScaleRuleTitle', 'Delete scale rule from "{0}" (draft)', parentResource.name),
        promptSteps,
        executeSteps,
        showLoadingPrompt: true
    });

    await wizard.prompt();
    wizardContext.activityTitle = localize('deleteScaleRuleTitle', 'Delete rule "{0}" from "{1}" (draft)', wizardContext.scaleRule?.name, parentResource.name);
    await wizard.execute();

    void showRevisionDraftDeployPopup(context, containerApp);
}
