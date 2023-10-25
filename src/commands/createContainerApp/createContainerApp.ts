/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { ResourceGroup } from "@azure/arm-resources";
import { LocationListStep, ResourceGroupListStep, VerifyProvidersStep } from "@microsoft/vscode-azext-azureutils";
import { AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, IActionContext, createSubscriptionContext, nonNullProp, nonNullValue, nonNullValueAndProp } from "@microsoft/vscode-azext-utils";
import { webProvider } from "../../constants";
import { ext } from "../../extensionVariables";
import { ContainerAppItem } from "../../tree/ContainerAppItem";
import type { ManagedEnvironmentItem } from "../../tree/ManagedEnvironmentItem";
import { createActivityContext } from "../../utils/activity/activityUtils";
import { localize } from "../../utils/localize";
import { pickEnvironment } from "../../utils/pickItem/pickEnvironment";
import { ImageSourceListStep } from "../image/imageSource/ImageSourceListStep";
import { IngressPromptStep } from "../ingress/IngressPromptStep";
import { ContainerAppCreateStep } from "./ContainerAppCreateStep";
import { ContainerAppNameStep } from "./ContainerAppNameStep";
import type { ICreateContainerAppContext } from "./ICreateContainerAppContext";
import { showContainerAppNotification } from "./showContainerAppNotification";

export async function createContainerApp(context: IActionContext, node?: ManagedEnvironmentItem): Promise<ContainerAppItem> {
    node ??= await pickEnvironment(context);

    const wizardContext: ICreateContainerAppContext = {
        ...context,
        ...createSubscriptionContext(node.subscription),
        ...await createActivityContext(),
        subscription: node.subscription,
        managedEnvironmentId: node.managedEnvironment.id,
        alwaysPromptIngress: true
    };

    const title: string = localize('createContainerApp', 'Create container app');

    const promptSteps: AzureWizardPromptStep<ICreateContainerAppContext>[] = [
        new ContainerAppNameStep(),
        new ImageSourceListStep(),
        new IngressPromptStep(),
    ];

    const executeSteps: AzureWizardExecuteStep<ICreateContainerAppContext>[] = [
        new VerifyProvidersStep([webProvider]),
        new ContainerAppCreateStep(),
    ];

    // Use the same resource group and location as the parent resource (managed environment)
    const resourceGroupName: string = nonNullValueAndProp(node.resource, 'resourceGroup');
    const resourceGroups: ResourceGroup[] = await ResourceGroupListStep.getResourceGroups(wizardContext);
    wizardContext.resourceGroup = nonNullValue(resourceGroups.find(rg => rg.name === resourceGroupName));

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
        localize('creating', 'Creating "{0}"...', newContainerAppName),
        async () => {
            wizardContext.activityTitle = localize('createNamedContainerApp', 'Create container app "{0}"', newContainerAppName);
            await wizard.execute();
        });

    const createdContainerApp = nonNullProp(wizardContext, 'containerApp');
    void showContainerAppNotification(createdContainerApp);
    return new ContainerAppItem(node.subscription, createdContainerApp);
}
