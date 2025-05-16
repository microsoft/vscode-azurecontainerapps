/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureWizard, createSubscriptionContext, nonNullValueAndProp, type IActionContext, type ISubscriptionContext } from "@microsoft/vscode-azext-utils";
import { type EnvironmentVariableItem } from "../../../tree/containers/EnvironmentVariableItem";
import { createActivityContext } from "../../../utils/activityUtils";
import { getManagedEnvironmentFromContainerApp } from "../../../utils/getResourceUtils";
import { getVerifyProvidersStep } from "../../../utils/getVerifyProvidersStep";
import { localize } from "../../../utils/localize";
import { pickEnvironmentVariable } from "../../../utils/pickItem/pickEnvironmentVariables";
import { isTemplateItemEditable, TemplateItemNotEditableError } from "../../../utils/revisionDraftUtils";
import { RevisionDraftDeployPromptStep } from "../../revisionDraft/RevisionDraftDeployPromptStep";
import { SecretCreateStep } from "../../secret/addSecret/SecretCreateStep";
import { SecretNameStep } from "../../secret/addSecret/SecretNameStep";
import { EnvironmentVariableType } from "../addEnvironmentVariable/EnvironmentVariableTypeListStep";
import { EnvironmentVariableEditDraftStep, type EnvironmentVariableEditOutputs } from "../editEnvironmentVariable/EnvironmentVariableEditDraftStep";
import { type EnvironmentVariableConvertContext } from "./EnvironmentVariableConvertContext";

/**
 * Automatically convert a 'Manual Input' environment variable to use a container app secret instead
 */
export async function convertEnvironmentVariable(context: IActionContext, node?: EnvironmentVariableItem): Promise<void> {
    const item: EnvironmentVariableItem = node ?? await pickEnvironmentVariable(context, { autoSelectDraft: true });
    const { subscription, containerApp } = item;

    if (!isTemplateItemEditable(item)) {
        throw new TemplateItemNotEditableError(item);
    }

    if (item.envVariable.secretRef) {
        throw new Error(localize('alreadySecret', 'The environment variable you chose to convert already uses a secret reference.'));
    }

    const subscriptionContext: ISubscriptionContext = createSubscriptionContext(subscription);
    const wizardContext: EnvironmentVariableConvertContext = {
        ...context,
        ...subscriptionContext,
        ...await createActivityContext({ withChildren: true }),
        subscription,
        managedEnvironment: await getManagedEnvironmentFromContainerApp({ ...context, ...subscriptionContext }, containerApp),
        containerApp,
        containersIdx: item.containersIdx,
        environmentVariable: item.envVariable,
        newSecretValue: nonNullValueAndProp(item.envVariable, 'value'),
        newEnvironmentVariableType: EnvironmentVariableType.SecretRef,
        isDraftCommand: true,
    };
    wizardContext.telemetry.properties.revisionMode = containerApp.revisionsMode;

    // Create an output reference to pass to the draft step so we can edit after prompting
    const editDraftStepOutputs: EnvironmentVariableEditOutputs = {};

    const wizard: AzureWizard<EnvironmentVariableConvertContext> = new AzureWizard(wizardContext, {
        title: localize('convertEnvironmentVariableTitle', 'Convert environment variable "{0}" to use a secret (draft)', wizardContext.environmentVariable.name),
        promptSteps: [
            new SecretNameStep(),
            new RevisionDraftDeployPromptStep(),
        ],
        executeSteps: [
            getVerifyProvidersStep<EnvironmentVariableConvertContext>(),
            new SecretCreateStep(),
            new EnvironmentVariableEditDraftStep(item, editDraftStepOutputs),
        ],
    });

    await wizard.prompt();
    wizardContext.activityTitle = localize('convertEnvironmentVariableActivityTitle', 'Convert environment variable "{0}" to use secret "{1}" (draft)', wizardContext.environmentVariable.name, wizardContext.newSecretName);
    editDraftStepOutputs.treeItemLabel = localize('convertLabel', 'Edit environment variable to use secret "{0}" (draft)', wizardContext.newSecretName);
    editDraftStepOutputs.outputLogSuccessMessage = localize('convertSuccess', 'Successfully edited environment variable "{0}" to use secret "{1}" (draft)', wizardContext.environmentVariable.name, wizardContext.newSecretName);
    editDraftStepOutputs.outputLogFailMessage = localize('convertFail', 'Failed to edit environment variable "{0}" to use secret "{1}" (draft)', wizardContext.environmentVariable.name, wizardContext.newSecretName);
    await wizard.execute();
}
