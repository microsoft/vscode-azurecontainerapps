/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { LocationListStep, VerifyProvidersStep } from "@microsoft/vscode-azext-azureutils";
import { AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, createSubscriptionContext, IActionContext, ICreateChildImplContext, nonNullProp } from "@microsoft/vscode-azext-utils";
import { webProvider } from "../../constants";
import { ext } from "../../extensionVariables";
import { ContainerAppItem } from "../../tree/ContainerAppItem";
import { ManagedEnvironmentItem } from "../../tree/ManagedEnvironmentItem";
import { createActivityContext } from "../../utils/activityUtils";
import { localize } from "../../utils/localize";
import { containerAppEnvironmentExperience } from "../../utils/pickContainerApp";
import { ContainerAppCreateStep } from "./ContainerAppCreateStep";
import { ContainerAppNameStep } from "./ContainerAppNameStep";
import { EnableIngressStep } from "./EnableIngressStep";
import { IContainerAppContext, IContainerAppWithActivityContext } from "./IContainerAppContext";
import { ImageSourceListStep } from "./ImageSourceListSTep";
import { showContainerAppCreated } from "./showContainerAppCreated";

export async function createContainerApp(context: IActionContext & Partial<ICreateChildImplContext> & Partial<IContainerAppContext>, node?: ManagedEnvironmentItem): Promise<ContainerAppItem> {
    node ??= await containerAppEnvironmentExperience(context, ext.rgApiV2.resources.azureResourceTreeDataProvider, {
        title: localize('createContainerApp', 'Create Container App'),
    });

    const wizardContext: IContainerAppWithActivityContext = {
        ...context,
        ...createSubscriptionContext(node.subscription),
        managedEnvironmentId: node.managedEnvironment.id,
        ...(await createActivityContext())
    };

    const title: string = localize('createContainerApp', 'Create Container App');

    const promptSteps: AzureWizardPromptStep<IContainerAppWithActivityContext>[] = [
        new ContainerAppNameStep(),
        new ImageSourceListStep(),
        new EnableIngressStep(),
    ];

    const executeSteps: AzureWizardExecuteStep<IContainerAppWithActivityContext>[] = [
        new VerifyProvidersStep([webProvider]),
        new ContainerAppCreateStep(),
    ];

    wizardContext.newResourceGroupName = node.resource.resourceGroup;
    await LocationListStep.setLocation(wizardContext, nonNullProp(node.resource, 'location'));

    const wizard: AzureWizard<IContainerAppWithActivityContext> = new AzureWizard(wizardContext, {
        title,
        promptSteps,
        executeSteps,
        showLoadingPrompt: true
    });

    await wizard.prompt();
    const newContainerAppName = nonNullProp(wizardContext, 'newContainerAppName');

    await ext.state.showCreatingChild(
        node.managedEnvironment.id,
        localize('creatingContainerApp', 'Creating Container App "{0}"...', newContainerAppName),
        async () => {
            wizardContext.activityTitle = localize('createNamedContainerApp', 'Create Container App "{0}"', newContainerAppName);
            try {
                await wizard.execute();
            } finally {
                // refresh this node even if create fails because container app provision failure throws an error, but still creates a container app
                // ext.state.notifyChildrenChanged(node.managedEnvironment.id);
            }
        });

    const createdContainerApp = nonNullProp(wizardContext, 'containerApp');
    void showContainerAppCreated(createdContainerApp);
    return new ContainerAppItem(node.subscription, createdContainerApp);
}
