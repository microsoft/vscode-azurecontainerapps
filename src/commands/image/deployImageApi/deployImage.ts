/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { VerifyProvidersStep } from "@microsoft/vscode-azext-azureutils";
import { AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, IActionContext, createSubscriptionContext } from "@microsoft/vscode-azext-utils";
import { webProvider } from "../../../constants";
import type { ContainerAppItem } from "../../../tree/ContainerAppItem";
import { createActivityContext } from "../../../utils/activity/activityUtils";
import { localize } from "../../../utils/localize";
import { ContainerAppOverwriteConfirmStep } from "../../../utils/updateContainerApp/ContainerAppOverwriteConfirmStep";
import { ContainerAppUpdateStep } from "../../../utils/updateContainerApp/ContainerAppUpdateStep";
import { ImageSourceListStep } from "../imageSource/ImageSourceListStep";
import { IContainerRegistryImageContext } from "../imageSource/containerRegistry/IContainerRegistryImageContext";
import type { DeployImageApiContext } from "./deployImageApi";

export async function deployImage(context: IActionContext & Partial<IContainerRegistryImageContext>, node: ContainerAppItem): Promise<void> {
    const { subscription, containerApp } = node;

    const wizardContext: DeployImageApiContext = {
        ...context,
        ...createSubscriptionContext(subscription),
        ...await createActivityContext(),
        subscription,
        containerApp
    };

    const promptSteps: AzureWizardPromptStep<DeployImageApiContext>[] = [
        new ImageSourceListStep(),
        new ContainerAppOverwriteConfirmStep(),
    ];

    const executeSteps: AzureWizardExecuteStep<DeployImageApiContext>[] = [
        new VerifyProvidersStep([webProvider]),
        new ContainerAppUpdateStep()
    ];

    const wizard: AzureWizard<DeployImageApiContext> = new AzureWizard(wizardContext, {
        title: localize('deploy', 'Deploy image to container app "{0}"', containerApp.name),
        promptSteps,
        executeSteps,
        showLoadingPrompt: true
    });

    await wizard.prompt();
    await wizard.execute();
}
