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
import { EnvFileListStep } from "../../image/imageSource/EnvFileListStep";
import { RevisionDraftDeployPromptStep } from "../../revisionDraft/RevisionDraftDeployPromptStep";
import { type EnvironmentVariablesEditContext } from "./EnvironmentVariablesEditContext";
import { EnvironmentVariablesEditDraftStep, type EnvironmentVariablesEditDraftStepOutputs } from "./EnvironmentVariablesEditDraftStep";

export async function editEnvironmentVariables(context: IActionContext, node?: EnvironmentVariablesItem): Promise<void> {
    const item: EnvironmentVariablesItem = node ?? await pickEnvironmentVariables(context, { autoSelectDraft: true });
    const { subscription, containerApp } = item;

    if (!isTemplateItemEditable(item)) {
        throw new TemplateItemNotEditableError(item);
    }

    const subscriptionContext: ISubscriptionContext = createSubscriptionContext(subscription);
    const parentResource: ContainerAppModel | Revision = getParentResourceFromItem(item);

    const wizardContext: EnvironmentVariablesEditContext = {
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

    // Create an output reference to pass to the draft step so we can edit after prompting
    const editDraftStepOutputs: EnvironmentVariablesEditDraftStepOutputs = {};

    const wizard = new AzureWizard<EnvironmentVariablesEditContext>(wizardContext, {
        title: localize('editEnvironmentVariables', 'Edit environment variables for "{0}" (draft)', parentResource.name),
        promptSteps: [
            new EnvFileListStep({ suppressSkipPick: true }),
            new RevisionDraftDeployPromptStep(),
        ],
        executeSteps: [
            getVerifyProvidersStep<EnvironmentVariablesEditContext>(),
            new EnvironmentVariablesEditDraftStep(item, editDraftStepOutputs),
        ],
    });

    await wizard.prompt();
    if (wizardContext.envPath) {
        wizardContext.activityTitle = localize('editEnvVarsFromFileActivityTitle', 'Edit environment variables for "{0}" from provided .env file (draft)', parentResource.name);
        editDraftStepOutputs.treeItemLabel = localize('saveEnvVarsToDraftLabel', 'Save environment variables from provided .env file to draft');
        editDraftStepOutputs.outputLogFailMessage = localize('editEnvVarsFileFail', 'Failed to edit environment variables for "{0}" from provided .env file (draft).', parentResource.name);
    }
    await wizard.execute();
}
