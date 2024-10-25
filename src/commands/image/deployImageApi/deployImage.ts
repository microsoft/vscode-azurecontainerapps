/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureWizard, createSubscriptionContext, type AzureWizardPromptStep, type IActionContext, type ISubscriptionContext } from "@microsoft/vscode-azext-utils";
import { type ContainerAppItem } from "../../../tree/ContainerAppItem";
import { createActivityContext } from "../../../utils/activityUtils";
import { getManagedEnvironmentFromContainerApp } from "../../../utils/getResourceUtils";
import { getVerifyProvidersStep } from "../../../utils/getVerifyProvidersStep";
import { getImageNameWithoutTag } from "../../../utils/imageNameUtils";
import { localize } from "../../../utils/localize";
import { ContainerAppOverwriteConfirmStep } from "../../ContainerAppOverwriteConfirmStep";
import { showContainerAppNotification } from "../../createContainerApp/showContainerAppNotification";
import { IngressPromptStep } from "../../ingress/IngressPromptStep";
import { ContainerAppUpdateStep } from "../imageSource/ContainerAppUpdateStep";
import { ImageSourceListStep } from "../imageSource/ImageSourceListStep";
import { type ContainerRegistryImageSourceContext } from "../imageSource/containerRegistry/ContainerRegistryImageSourceContext";
import { type DeployImageApiContext } from "./deployImageApi";

export async function deployImage(context: IActionContext & Partial<ContainerRegistryImageSourceContext>, node: ContainerAppItem): Promise<void> {
    const { subscription, containerApp } = node;
    const subscriptionContext: ISubscriptionContext = createSubscriptionContext(subscription);

    const wizardContext: DeployImageApiContext = {
        ...context,
        ...subscriptionContext,
        ...await createActivityContext(),
        subscription,
        managedEnvironment: await getManagedEnvironmentFromContainerApp({ ...context, ...subscriptionContext }, containerApp),
        containerApp,
    };

    wizardContext.telemetry.properties.revisionMode = containerApp.revisionsMode;

    const promptSteps: AzureWizardPromptStep<DeployImageApiContext>[] = [
        new ImageSourceListStep(),
    ];

    // If more than just the image tag changed, prompt for ingress again
    if (getImageNameWithoutTag(wizardContext.containerApp?.template?.containers?.[0].image ?? '') !== getImageNameWithoutTag(context.image ?? '')) {
        promptSteps.push(new IngressPromptStep());
    }
    promptSteps.push(new ContainerAppOverwriteConfirmStep());

    const wizard: AzureWizard<DeployImageApiContext> = new AzureWizard(wizardContext, {
        title: localize('deploy', 'Deploy image to container app "{0}"', containerApp.name),
        promptSteps,
        executeSteps: [
            getVerifyProvidersStep<DeployImageApiContext>(),
            new ContainerAppUpdateStep(),
        ],
        showLoadingPrompt: true
    });

    await wizard.prompt();
    await wizard.execute();

    if (!wizardContext.suppressNotification) {
        void showContainerAppNotification(containerApp, true /** isUpdate */);
    }
}
