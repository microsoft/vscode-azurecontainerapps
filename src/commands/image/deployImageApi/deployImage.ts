/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, IActionContext, createSubscriptionContext } from "@microsoft/vscode-azext-utils";
import type { ContainerAppItem } from "../../../tree/ContainerAppItem";
import { createActivityContext } from "../../../utils/activity/activityUtils";
import { getVerifyProvidersStep } from "../../../utils/getVerifyProvidersStep";
import { localize } from "../../../utils/localize";
import { ContainerAppOverwriteConfirmStep } from "../../ContainerAppOverwriteConfirmStep";
import { showContainerAppNotification } from "../../createContainerApp/showContainerAppNotification";
import { ContainerAppUpdateStep } from "../imageSource/ContainerAppUpdateStep";
import { ImageSourceListStep } from "../imageSource/ImageSourceListStep";
import { ContainerRegistryImageSourceContext } from "../imageSource/containerRegistry/ContainerRegistryImageSourceContext";
import { RegistryEnableAdminUserStep } from "../imageSource/containerRegistry/acr/RegistryEnableAdminUserStep";
import type { DeployImageApiContext } from "./deployImageApi";

export async function deployImage(context: IActionContext & Partial<ContainerRegistryImageSourceContext>, node: ContainerAppItem): Promise<void> {
    const { subscription, containerApp } = node;

    const wizardContext: DeployImageApiContext = {
        ...context,
        ...createSubscriptionContext(subscription),
        ...await createActivityContext(),
        subscription,
        containerApp
    };

    wizardContext.telemetry.properties.revisionMode = containerApp.revisionsMode;

    const promptSteps: AzureWizardPromptStep<DeployImageApiContext>[] = [
        new RegistryEnableAdminUserStep(),
        new ImageSourceListStep(),
        new ContainerAppOverwriteConfirmStep(),
    ];

    const executeSteps: AzureWizardExecuteStep<DeployImageApiContext>[] = [
        getVerifyProvidersStep<DeployImageApiContext>(),
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

    if (!wizardContext.suppressNotification) {
        void showContainerAppNotification(containerApp, true /** isUpdate */);
    }
}
