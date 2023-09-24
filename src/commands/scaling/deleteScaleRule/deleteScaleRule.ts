/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/
import { Revision } from "@azure/arm-appcontainers";
import { AzureWizard, IActionContext, createSubscriptionContext } from "@microsoft/vscode-azext-utils";
import { ContainerAppModel } from "../../../tree/ContainerAppItem";
import { ScaleRuleGroupItem } from "../../../tree/scaling/ScaleRuleGroupItem";
import { createActivityContext } from "../../../utils/activityUtils";
import { localize } from "../../../utils/localize";
import { pickScaleRuleGroup } from "../../../utils/pickItem/pickScale";
import { getParentResource } from "../../../utils/revisionDraftUtils";
import { ScaleRuleTypeListStep } from "../addScaleRule/ScaleRuleTypeListStep";
import { DeleteScaleRuleStep } from "./DeleteScaleRuleStep";
import { IDeleteScaleRuleContext } from "./IDeleteScaleRuleContext";

export async function deleteScaleRule(context: IActionContext, node?: ScaleRuleGroupItem): Promise<void> {
    const item: ScaleRuleGroupItem = node ?? await pickScaleRuleGroup(context, { autoSelectDraft: true });
    const { subscription, containerApp, revision } = item;

    const parentResource: ContainerAppModel | Revision = getParentResource(containerApp, revision);

    const wizardContext: IDeleteScaleRuleContext = {
        ...context,
        ...createSubscriptionContext(subscription),
        ...await createActivityContext(),
        containerApp,
        subscription
    }

    const wizard: AzureWizard<IDeleteScaleRuleContext> = new AzureWizard(wizardContext, {
        title: localize('deleteScaleRuleTitle', 'Delete scale rule from container app "{0}" (draft)', containerApp.name),
        //different
        promptSteps: [new ScaleRuleTypeListStep()],
        executeSteps: [new DeleteScaleRuleStep(item)],
        showLoadingPrompt: true
    });

    await wizard.prompt();
    //this may change
    wizardContext.activityTitle = localize('deleteScaleRuleTitle', 'Delete rule "{1}" from "{2}" (draft)', wizardContext.scaleRule?.name, parentResource.name);

    await wizard.execute();
}
