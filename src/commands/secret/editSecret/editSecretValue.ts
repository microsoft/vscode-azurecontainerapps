/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizard, createSubscriptionContext, type AzureWizardExecuteStep, type AzureWizardPromptStep, type IActionContext } from "@microsoft/vscode-azext-utils";
import { ext } from "../../../extensionVariables";
import { type SecretItem } from "../../../tree/configurations/secrets/SecretItem";
import { createActivityContext } from "../../../utils/activity/activityUtils";
import { localize } from "../../../utils/localize";
import { pickSecret } from "../../../utils/pickItem/pickSecret";
import { type ISecretContext } from "../ISecretContext";
import { SecretValueStep } from "../addSecret/SecretValueStep";
import { SecretValueUpdateStep } from "./SecretValueUpdateStep";

export async function editSecretValue(context: IActionContext, node?: SecretItem): Promise<void> {
    const item: SecretItem = node ?? await pickSecret(context);

    const { subscription, containerApp } = item;

    const wizardContext: ISecretContext = {
        ...context,
        ...createSubscriptionContext(subscription),
        ...(await createActivityContext()),
        subscription,
        containerApp,
        secretName: item.secretName
    };

    const promptSteps: AzureWizardPromptStep<ISecretContext>[] = [
        new SecretValueStep()
    ];

    const executeSteps: AzureWizardExecuteStep<ISecretContext>[] = [
        new SecretValueUpdateStep()
    ];

    const wizard: AzureWizard<ISecretContext> = new AzureWizard(wizardContext, {
        title: localize('updateSecret', 'Update secret value for "{0}" in container app "{1}"', wizardContext.secretName, containerApp.name),
        promptSteps,
        executeSteps,
    });

    await wizard.prompt();

    await ext.state.runWithTemporaryDescription(item.id, localize('updating', 'Updating...'), async () => {
        await wizard.execute();
        ext.state.notifyChildrenChanged(containerApp.managedEnvironmentId);
    });
}
