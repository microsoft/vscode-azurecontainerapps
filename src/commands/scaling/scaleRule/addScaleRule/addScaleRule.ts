/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type Revision } from "@azure/arm-appcontainers";
import { AzureWizard, createSubscriptionContext, nonNullProp, type IActionContext } from "@microsoft/vscode-azext-utils";
import { type ContainerAppModel } from "../../../../tree/ContainerAppItem";
import { type ScaleRuleGroupItem } from "../../../../tree/scaling/ScaleRuleGroupItem";
import { createActivityContext } from "../../../../utils/activity/activityUtils";
import { localize } from "../../../../utils/localize";
import { pickScaleRuleGroup } from "../../../../utils/pickItem/pickScale";
import { getParentResource } from "../../../../utils/revisionDraftUtils";
import { AddScaleRuleStep } from "./AddScaleRuleStep";
import { type IAddScaleRuleContext } from "./IAddScaleRuleContext";
import { ScaleRuleNameStep } from "./ScaleRuleNameStep";
import { ScaleRuleTypeListStep } from "./ScaleRuleTypeListStep";

export async function addScaleRule(context: IActionContext, node?: ScaleRuleGroupItem): Promise<void> {
    const item: ScaleRuleGroupItem = node ?? await pickScaleRuleGroup(context, { autoSelectDraft: true });
    const { subscription, containerApp, revision } = item;

    const parentResource: ContainerAppModel | Revision = getParentResource(containerApp, revision);

    const wizardContext: IAddScaleRuleContext = {
        ...context,
        ...createSubscriptionContext(subscription),
        ...await createActivityContext(),
        containerApp,
        subscription,
        parentResourceName: nonNullProp(parentResource, 'name')
    };

    const wizard: AzureWizard<IAddScaleRuleContext> = new AzureWizard(wizardContext, {
        title: localize('addScaleRuleTitle', 'Add scale rule to "{0}" (draft)', parentResource.name),
        promptSteps: [new ScaleRuleNameStep(), new ScaleRuleTypeListStep()],
        executeSteps: [new AddScaleRuleStep(item)],
        showLoadingPrompt: true
    });

    await wizard.prompt();
    wizardContext.activityTitle = localize('addScaleRuleTitle', 'Add {0} rule "{1}" to "{2}" (draft)', wizardContext.newRuleType, wizardContext.newRuleName, parentResource.name);
    await wizard.execute();
}
