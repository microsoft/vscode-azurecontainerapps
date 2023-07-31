/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, IActionContext, createSubscriptionContext } from "@microsoft/vscode-azext-utils";
import { ext } from "../../../extensionVariables";
import type { SecretItem } from "../../../tree/configurations/secrets/SecretItem";
import { SecretsItem } from "../../../tree/configurations/secrets/SecretsItem";
import { createActivityContext } from "../../../utils/activityUtils";
import { localize } from "../../../utils/localize";
import { pickSecret } from "../../../utils/pickItem/pickSecret";
import type { ISecretContext } from "../ISecretContext";
import { SecretDeleteConfirmStep } from "./SecretDeleteConfirmStep";
import { SecretDeleteStep } from "./SecretDeleteStep";

export async function deleteSecret(context: IActionContext, node?: SecretItem): Promise<void> {
    const item: SecretItem = node ?? await pickSecret(context);

    const { subscription, containerApp } = item;

    const wizardContext: ISecretContext = {
        ...context,
        ...createSubscriptionContext(subscription),
        ...(await createActivityContext()),
        subscription,
        containerApp,
        existingSecretName: item.secretName
    };

    const promptSteps: AzureWizardPromptStep<ISecretContext>[] = [
        new SecretDeleteConfirmStep()
    ];

    const executeSteps: AzureWizardExecuteStep<ISecretContext>[] = [
        new SecretDeleteStep()
    ];

    const wizard: AzureWizard<ISecretContext> = new AzureWizard(wizardContext, {
        title: localize('deleteSecret', 'Delete secret from container app "{0}"', containerApp.name),
        promptSteps,
        executeSteps,
    });

    await wizard.prompt();

    const secretId: string = `${wizardContext.containerApp?.id}/${SecretsItem.idSuffix}/${wizardContext.existingSecretName}`;
    await ext.state.showDeleting(secretId, async () => {
        await wizard.execute();
    });
}
