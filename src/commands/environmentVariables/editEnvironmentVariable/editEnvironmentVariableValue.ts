/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureWizard, createSubscriptionContext, type IActionContext, type ISubscriptionContext } from "@microsoft/vscode-azext-utils";
import { type EnvironmentVariableItem } from "../../../tree/containers/EnvironmentVariableItem";
import { createActivityContext } from "../../../utils/activityUtils";
import { getManagedEnvironmentFromContainerApp } from "../../../utils/getResourceUtils";
import { getVerifyProvidersStep } from "../../../utils/getVerifyProvidersStep";
import { localize } from "../../../utils/localize";
import { pickEnvironmentVariable } from "../../../utils/pickItem/pickEnvironmentVariables";
import { isTemplateItemEditable, TemplateItemNotEditableError } from "../../../utils/revisionDraftUtils";
import { RevisionDraftDeployPromptStep } from "../../revisionDraft/RevisionDraftDeployPromptStep";
import { EnvironmentVariableTypeListStep } from "../addEnvironmentVariable/EnvironmentVariableTypeListStep";
import { type EnvironmentVariableEditContext } from "./EnvironmentVariableEditContext";
import { EnvironmentVariableEditDraftStep } from "./EnvironmentVariableEditDraftStep";

export async function editEnvironmentVariableValue(context: IActionContext, node?: EnvironmentVariableItem): Promise<void> {
    const item: EnvironmentVariableItem = node ?? await pickEnvironmentVariable(context, { autoSelectDraft: true });
    const { subscription, containerApp } = item;

    if (!isTemplateItemEditable(item)) {
        throw new TemplateItemNotEditableError(item);
    }

    const subscriptionContext: ISubscriptionContext = createSubscriptionContext(subscription);

    const wizardContext: EnvironmentVariableEditContext = {
        ...context,
        ...subscriptionContext,
        ...await createActivityContext(),
        subscription,
        managedEnvironment: await getManagedEnvironmentFromContainerApp({ ...context, ...subscriptionContext }, containerApp),
        containerApp,
        containersIdx: item.containersIdx,
        environmentVariable: item.envVariable,
        isDraftCommand: true,
    };
    wizardContext.telemetry.properties.revisionMode = containerApp.revisionsMode;

    const wizard: AzureWizard<EnvironmentVariableEditContext> = new AzureWizard(wizardContext, {
        title: localize('editEnvironmentVariableValue', 'Edit environment variable value for "{0}" (draft)', wizardContext.environmentVariable.name),
        promptSteps: [
            new EnvironmentVariableTypeListStep(),
            new RevisionDraftDeployPromptStep(),
        ],
        executeSteps: [
            getVerifyProvidersStep<EnvironmentVariableEditContext>(),
            new EnvironmentVariableEditDraftStep(item),
        ],
    });

    await wizard.prompt();
    await wizard.execute();
}
