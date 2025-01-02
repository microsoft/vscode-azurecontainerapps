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
import { EnvironmentVariableEditDraftStep } from "../editEnvironmentVariable/EnvironmentVariableEditDraftStep";
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

    // Todo: Make it so that the command only runs if the chosen environment variable is not already a secretRef

    const subscriptionContext: ISubscriptionContext = createSubscriptionContext(subscription);
    const wizardContext: EnvironmentVariableConvertContext = {
        ...context,
        ...subscriptionContext,
        ...await createActivityContext(true),
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

    const wizard: AzureWizard<EnvironmentVariableConvertContext> = new AzureWizard(wizardContext, {
        title: localize('convertEnvironmentVariableTitle', 'Convert environment variable "{0}" to use a secret (draft)', wizardContext.environmentVariable.name),
        promptSteps: [
            new SecretNameStep(),
            new RevisionDraftDeployPromptStep(),
        ],
        executeSteps: [
            getVerifyProvidersStep<EnvironmentVariableConvertContext>(),
            // Todo: Add output
            new SecretCreateStep(),
            // Todo: Adjust priority level
            // Todo: Add output
            new EnvironmentVariableEditDraftStep(item),
        ],
    });

    await wizard.prompt();
    await wizard.execute();
}
