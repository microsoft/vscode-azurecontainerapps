/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, IActionContext, createSubscriptionContext } from "@microsoft/vscode-azext-utils";
import { ext } from "../../../extensionVariables";
import { SecretsItem } from "../../../tree/configurations/secrets/SecretsItem";
import { createActivityContext } from "../../../utils/activityUtils";
import { localize } from "../../../utils/localize";
import { pickContainerApp } from "../../../utils/pickItem/pickContainerApp";
import type { ISecretContext } from "../ISecretContext";
import { SecretCreateStep } from "./SecretCreateStep";
import { SecretNameStep } from "./SecretNameStep";
import { SecretValueStep } from "./SecretValueStep";

export async function addSecret(context: IActionContext, node?: SecretsItem): Promise<void> {
    const { subscription, containerApp } = node ?? await pickContainerApp(context);

    const wizardContext: ISecretContext = {
        ...context,
        ...createSubscriptionContext(subscription),
        ...(await createActivityContext()),
        subscription,
        containerApp,
    };

    const promptSteps: AzureWizardPromptStep<ISecretContext>[] = [
        new SecretNameStep(),
        new SecretValueStep()
    ];

    const executeSteps: AzureWizardExecuteStep<ISecretContext>[] = [
        new SecretCreateStep()
    ];

    const wizard: AzureWizard<ISecretContext> = new AzureWizard(wizardContext, {
        title: localize('addSecret', 'Add secret to container app "{0}"', containerApp.name),
        promptSteps,
        executeSteps,
        showLoadingPrompt: true
    });

    await wizard.prompt();

    const parentId: string = `${containerApp.id}/${SecretsItem.idSuffix}`;
    await ext.state.showCreatingChild(parentId, localize('creatingSecret', 'Creating secret...'), async () => {
        await wizard.execute();
    });

    ext.state.notifyChildrenChanged(containerApp.managedEnvironmentId);
}
