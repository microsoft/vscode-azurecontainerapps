/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type Revision } from "@azure/arm-appcontainers";
import { AzureWizard, createSubscriptionContext, type IActionContext, type ISubscriptionContext } from "@microsoft/vscode-azext-utils";
import { type ContainerAppModel } from "../../../tree/ContainerAppItem";
import { type EnvironmentVariablesItem } from "../../../tree/containers/EnvironmentVariablesItem";
import { createActivityContext } from "../../../utils/activityUtils";
import { getManagedEnvironmentFromContainerApp } from "../../../utils/getResourceUtils";
import { getVerifyProvidersStep } from "../../../utils/getVerifyProvidersStep";
import { localize } from "../../../utils/localize";
import { pickEnvironmentVariables } from "../../../utils/pickItem/pickEnvironmentVariables";
import { getParentResourceFromItem, isTemplateItemEditable, TemplateItemNotEditableError } from "../../../utils/revisionDraftUtils";
import { RevisionDraftDeployPromptStep } from "../../revisionDraft/RevisionDraftDeployPromptStep";
import { type EnvironmentVariableAddContext } from "./EnvironmentVariableAddContext";
import { EnvironmentVariableAddDraftStep } from "./EnvironmentVariableAddDraftStep";
import { EnvironmentVariableNameStep } from "./EnvironmentVariableNameStep";
import { EnvironmentVariableTypeListStep } from "./EnvironmentVariableTypeListStep";

export async function addEnvironmentVariable(context: IActionContext, node?: EnvironmentVariablesItem): Promise<void> {
    const item: EnvironmentVariablesItem = node ?? await pickEnvironmentVariables(context, { autoSelectDraft: true });
    const { subscription, containerApp } = item;

    if (!isTemplateItemEditable(item)) {
        throw new TemplateItemNotEditableError(item);
    }

    const subscriptionContext: ISubscriptionContext = createSubscriptionContext(subscription);
    const parentResource: ContainerAppModel | Revision = getParentResourceFromItem(item);

    const wizardContext: EnvironmentVariableAddContext = {
        ...context,
        ...subscriptionContext,
        ...await createActivityContext(),
        subscription,
        managedEnvironment: await getManagedEnvironmentFromContainerApp({ ...context, ...subscriptionContext }, containerApp),
        containerApp,
        containersIdx: item.containersIdx,
        isDraftCommand: true,
    };
    wizardContext.telemetry.properties.revisionMode = containerApp.revisionsMode;

    const wizard: AzureWizard<EnvironmentVariableAddContext> = new AzureWizard(wizardContext, {
        title: localize('updateEnvironmentVariables', 'Add environment variable to "{0}" (draft)', parentResource.name),
        promptSteps: [
            new EnvironmentVariableNameStep(item),
            new EnvironmentVariableTypeListStep(),
            new RevisionDraftDeployPromptStep(),
        ],
        executeSteps: [
            getVerifyProvidersStep<EnvironmentVariableAddContext>(),
            new EnvironmentVariableAddDraftStep(item),
        ],
    });

    await wizard.prompt();
    wizardContext.activityTitle = localize('updateEnvironmentVariables', 'Add environment variable "{0}" to "{1}" (draft)', wizardContext.newEnvironmentVariableName, parentResource.name);
    await wizard.execute();
}
