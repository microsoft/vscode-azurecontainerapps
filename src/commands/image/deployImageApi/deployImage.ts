/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type ContainerAppsAPIClient, type ManagedEnvironment } from "@azure/arm-appcontainers";
import { uiUtils } from "@microsoft/vscode-azext-azureutils";
import { AzureWizard, createSubscriptionContext, nonNullValue, type AzureWizardExecuteStep, type AzureWizardPromptStep, type IActionContext, type ISubscriptionActionContext, type ISubscriptionContext } from "@microsoft/vscode-azext-utils";
import { type ContainerAppItem, type ContainerAppModel } from "../../../tree/ContainerAppItem";
import { createActivityContext } from "../../../utils/activity/activityUtils";
import { createContainerAppsAPIClient } from "../../../utils/azureClients";
import { getVerifyProvidersStep } from "../../../utils/getVerifyProvidersStep";
import { localize } from "../../../utils/localize";
import { ContainerAppOverwriteConfirmStep } from "../../ContainerAppOverwriteConfirmStep";
import { showContainerAppNotification } from "../../createContainerApp/showContainerAppNotification";
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

async function getManagedEnvironmentFromContainerApp(context: ISubscriptionActionContext, containerApp: ContainerAppModel): Promise<ManagedEnvironment> {
    const client: ContainerAppsAPIClient = await createContainerAppsAPIClient(context);
    const managedEnvironments: ManagedEnvironment[] = await uiUtils.listAllIterator(client.managedEnvironments.listBySubscription());
    return nonNullValue(managedEnvironments.find(m => m.id === containerApp.managedEnvironmentId));
}
