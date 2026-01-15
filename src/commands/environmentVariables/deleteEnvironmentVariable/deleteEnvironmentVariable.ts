/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type Revision } from "@azure/arm-appcontainers";
import { AzureWizard, createSubscriptionContext, DeleteConfirmationStep, type IActionContext, type ISubscriptionContext } from "@microsoft/vscode-azext-utils";
import { type ContainerAppModel } from "../../../tree/ContainerAppItem";
import { type EnvironmentVariableItem } from "../../../tree/containers/EnvironmentVariableItem";
import { createActivityContext } from "../../../utils/activityUtils";
import { getManagedEnvironmentFromContainerApp } from "../../../utils/getResourceUtils";
import { getVerifyProvidersStep } from "../../../utils/getVerifyProvidersStep";
import { localize } from "../../../utils/localize";
import { pickEnvironmentVariable } from "../../../utils/pickItem/pickEnvironmentVariables";
import { getParentResourceFromItem, isTemplateItemEditable, TemplateItemNotEditableError } from "../../../utils/revisionDraftUtils";
import { RevisionDraftDeployPromptStep } from "../../revisionDraft/RevisionDraftDeployPromptStep";
import { type EnvironmentVariableDeleteContext } from "./EnvironmentVariableDeleteContext";
import { EnvironmentVariableDeleteDraftStep } from "./EnvironmentVariableDeleteDraftStep";

export async function deleteEnvironmentVariable(context: IActionContext, node?: EnvironmentVariableItem): Promise<void> {
    const item: EnvironmentVariableItem = node ?? await pickEnvironmentVariable(context, { autoSelectDraft: true });
    const { subscription, containerApp } = item;

    if (!isTemplateItemEditable(item)) {
        throw new TemplateItemNotEditableError(item);
    }

    const subscriptionContext: ISubscriptionContext = createSubscriptionContext(subscription);
    const parentResource: ContainerAppModel | Revision = getParentResourceFromItem(item);

    const wizardContext: EnvironmentVariableDeleteContext = {
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

    const confirmMessage: string = localize('confirmDeleteEnv', 'Are you sure you want to delete environment variable "{0}" locally?\n\nThis change will not be reflected in your container app until you deploy changes.', item.envVariable.name);
    const wizard = new AzureWizard<EnvironmentVariableDeleteContext>(wizardContext, {
        title: localize('deleteEnvironmentVariable', 'Delete environment variable "{0}" from "{1}" (draft)', item.envVariable.name, parentResource.name),
        promptSteps: [
            new DeleteConfirmationStep(confirmMessage),
            new RevisionDraftDeployPromptStep(),
        ],
        executeSteps: [
            getVerifyProvidersStep<EnvironmentVariableDeleteContext>(),
            new EnvironmentVariableDeleteDraftStep(item),
        ],
    });

    await wizard.prompt();
    await wizard.execute();
}
