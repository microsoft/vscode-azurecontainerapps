/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { LocationListStep, VerifyProvidersStep } from "@microsoft/vscode-azext-azureutils";
import { AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, IActionContext, ICreateChildImplContext, createSubscriptionContext, nonNullProp } from "@microsoft/vscode-azext-utils";
import { webProvider } from "../../constants";
import { ext } from "../../extensionVariables";
import { ContainerAppItem } from "../../tree/ContainerAppItem";
import type { ManagedEnvironmentItem } from "../../tree/ManagedEnvironmentItem";
import { createActivityContext } from "../../utils/activityUtils";
import { localize } from "../../utils/localize";
import { containerAppEnvironmentExperience } from "../../utils/pickContainerApp";
import { ImageSourceListStep } from "../deployImage/imageSource/ImageSourceListStep";
import { IngressPromptStep } from "../ingress/IngressPromptStep";
import { ContainerAppCreateStep } from "./ContainerAppCreateStep";
import { ContainerAppNameStep } from "./ContainerAppNameStep";
import type { ICreateContainerAppContext } from "./ICreateContainerAppContext";
import { showContainerAppCreated } from "./showContainerAppCreated";

export async function createContainerApp(context: IActionContext & Partial<ICreateChildImplContext> & Partial<ICreateContainerAppContext>, node?: ManagedEnvironmentItem): Promise<ContainerAppItem> {
    node ??= await containerAppEnvironmentExperience(context, ext.rgApiV2.resources.azureResourceTreeDataProvider, {
        title: localize('createContainerApp', 'Create Container App'),
    });

    const wizardContext: ICreateContainerAppContext = {
        ...context,
        ...createSubscriptionContext(node.subscription),
        ...(await createActivityContext()),
        subscription: node.subscription,
        managedEnvironmentId: node.managedEnvironment.id,
    };

    const title: string = localize('createContainerApp', 'Create Container App');

    const promptSteps: AzureWizardPromptStep<ICreateContainerAppContext>[] = [
        new ContainerAppNameStep(),
        new ImageSourceListStep(),
        new IngressPromptStep(),
    ];

    const executeSteps: AzureWizardExecuteStep<ICreateContainerAppContext>[] = [
        new VerifyProvidersStep([webProvider]),
        new ContainerAppCreateStep(),
    ];

    wizardContext.newResourceGroupName = node.resource.resourceGroup;
    await LocationListStep.setLocation(wizardContext, nonNullProp(node.resource, 'location'));

    const wizard: AzureWizard<ICreateContainerAppContext> = new AzureWizard(wizardContext, {
        title,
        promptSteps,
        executeSteps,
        showLoadingPrompt: true
    });

    // we want to add the quick start image _only_ for the create scenairo
    wizardContext.showQuickStartImage = true;

    await wizard.prompt();
    const newContainerAppName = nonNullProp(wizardContext, 'newContainerAppName');

    await ext.state.showCreatingChild(
        node.managedEnvironment.id,
        localize('creatingContainerApp', 'Creating Container App "{0}"...', newContainerAppName),
        async () => {
            wizardContext.activityTitle = localize('createNamedContainerApp', 'Create Container App "{0}"', newContainerAppName);
            await wizard.execute();
        });

    const createdContainerApp = nonNullProp(wizardContext, 'containerApp');
    void showContainerAppCreated(createdContainerApp);
    return new ContainerAppItem(node.subscription, createdContainerApp);
}
