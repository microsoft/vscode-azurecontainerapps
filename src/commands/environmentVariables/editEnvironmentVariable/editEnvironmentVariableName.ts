/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type Revision } from "@azure/arm-appcontainers";
import { AzureWizard, createSubscriptionContext, type IActionContext, type ISubscriptionContext } from "@microsoft/vscode-azext-utils";
import { type ContainerAppModel } from "../../../tree/ContainerAppItem";
import { type EnvironmentVariableItem } from "../../../tree/containers/EnvironmentVariableItem";
import { createActivityContext } from "../../../utils/activityUtils";
import { getManagedEnvironmentFromContainerApp } from "../../../utils/getResourceUtils";
import { getVerifyProvidersStep } from "../../../utils/getVerifyProvidersStep";
import { localize } from "../../../utils/localize";
import { pickEnvironmentVariable } from "../../../utils/pickItem/pickEnvironmentVariables";
import { getParentResourceFromItem, isTemplateItemEditable, TemplateItemNotEditableError } from "../../../utils/revisionDraftUtils";
import { RevisionDraftDeployPromptStep } from "../../revisionDraft/RevisionDraftDeployPromptStep";
import { EnvironmentVariableNameStep } from "../addEnvironmentVariable/EnvironmentVariableNameStep";
import { type EnvironmentVariableEditContext } from "./EnvironmentVariableEditContext";
import { EnvironmentVariableEditDraftStep } from "./EnvironmentVariableEditDraftStep";

export async function editEnvironmentVariableName(context: IActionContext, node?: EnvironmentVariableItem): Promise<void> {
    const item: EnvironmentVariableItem = node ?? await pickEnvironmentVariable(context, { autoSelectDraft: true });
    const { subscription, containerApp } = item;

    if (!isTemplateItemEditable(item)) {
        throw new TemplateItemNotEditableError(item);
    }

    const subscriptionContext: ISubscriptionContext = createSubscriptionContext(subscription);
    const parentResource: ContainerAppModel | Revision = getParentResourceFromItem(item);

    const wizardContext: EnvironmentVariableEditContext = {
        ...context,
        ...subscriptionContext,
        ...await createActivityContext(),
        subscription,
        managedEnvironment: await getManagedEnvironmentFromContainerApp({ ...context, ...subscriptionContext }, containerApp),
        containerApp,
        containersIdx: item.containersIdx,
        environmentVariable: item.envVariable,
    };
    wizardContext.telemetry.properties.revisionMode = containerApp.revisionsMode;

    const wizard: AzureWizard<EnvironmentVariableEditContext> = new AzureWizard(wizardContext, {
        title: localize('editEnvironmentVariableTitle', 'Edit environment variable name in "{0}" (draft)', parentResource.name),
        promptSteps: [
            new EnvironmentVariableNameStep(item),
            new RevisionDraftDeployPromptStep(),
        ],
        executeSteps: [
            getVerifyProvidersStep<EnvironmentVariableEditContext>(),
            new EnvironmentVariableEditDraftStep(item),
        ],
    });

    await wizard.prompt();
    wizardContext.activityTitle = localize('editEnvironmentVariableActivityTitle', 'Edit environment variable name to "{0}" in "{1}" (draft)', wizardContext.newEnvironmentVariableName, parentResource.name);
    await wizard.execute();
}
