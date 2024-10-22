/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type Revision, type Scale, type Template } from "@azure/arm-appcontainers";
import { AzureWizard, createSubscriptionContext, nonNullValueAndProp, type IActionContext } from "@microsoft/vscode-azext-utils";
import { ext } from "../../../extensionVariables";
import { type ContainerAppModel } from "../../../tree/ContainerAppItem";
import { type ScaleItem } from "../../../tree/scaling/ScaleItem";
import { createActivityContext } from "../../../utils/activityUtils";
import { localize } from "../../../utils/localize";
import { pickScale } from "../../../utils/pickItem/pickScale";
import { getParentResource, isTemplateItemEditable, throwTemplateItemNotEditable } from "../../../utils/revisionDraftUtils";
import { RevisionDraftDeployPromptStep } from "../../revisionDraft/RevisionDraftDeployPromptStep";
import { type ScaleRangeContext } from "./ScaleRangeContext";
import { ScaleRangePromptStep } from "./ScaleRangePromptStep";
import { ScaleRangeUpdateStep } from "./ScaleRangeUpdateStep";

export async function editScaleRange(context: IActionContext, node?: ScaleItem): Promise<void> {
    const item: ScaleItem = node ?? await pickScale(context, { autoSelectDraft: true });
    const { containerApp, revision, subscription } = item;

    if (!isTemplateItemEditable(item)) {
        throwTemplateItemNotEditable(item);
    }

    const parentResource: ContainerAppModel | Revision = getParentResource(containerApp, revision);
    let template: Template | undefined;

    if (ext.revisionDraftFileSystem.doesContainerAppsItemHaveRevisionDraft(item)) {
        template = ext.revisionDraftFileSystem.parseRevisionDraft(item);
    } else {
        template = parentResource.template;
    }

    const scale: Scale = nonNullValueAndProp(template, 'scale');
    const wizardContext: ScaleRangeContext = {
        ...context,
        ...createSubscriptionContext(subscription),
        ...await createActivityContext(),
        containerApp,
        subscription,
        scaleMinRange: scale.minReplicas ?? 0,
        scaleMaxRange: scale.maxReplicas ?? 0
    };

    const wizard: AzureWizard<ScaleRangeContext> = new AzureWizard(wizardContext, {
        title: localize('editScaleRangePre', 'Update replica scaling range for "{0}" (draft)', parentResource.name),
        promptSteps: [
            new ScaleRangePromptStep(),
            new RevisionDraftDeployPromptStep(),
        ],
        executeSteps: [
            new ScaleRangeUpdateStep(item),
        ],
        showLoadingPrompt: true
    });

    await wizard.prompt();
    wizardContext.activityTitle = localize('editScaleRange', 'Update replica scaling range to "{0}-{1}" for "{2}" (draft)', wizardContext.newMinRange, wizardContext.newMaxRange, parentResource.name);
    await wizard.execute();
}
