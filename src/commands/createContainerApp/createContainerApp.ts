/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ResourceGroup } from "@azure/arm-resources";
import { LocationListStep, ResourceGroupListStep } from "@microsoft/vscode-azext-azureutils";
import { AzureWizard, createSubscriptionContext, nonNullProp, nonNullValue, nonNullValueAndProp, type AzureWizardExecuteStep, type AzureWizardPromptStep, type IActionContext } from "@microsoft/vscode-azext-utils";
import { ext } from "../../extensionVariables";
import { ContainerAppItem } from "../../tree/ContainerAppItem";
import { ManagedEnvironmentItem } from "../../tree/ManagedEnvironmentItem";
import { createActivityContext } from "../../utils/activityUtils";
import { isAzdExtensionInstalled } from "../../utils/azdUtils";
import { getVerifyProvidersStep } from "../../utils/getVerifyProvidersStep";
import { localize } from "../../utils/localize";
import { pickEnvironment } from "../../utils/pickItem/pickEnvironment";
import { ImageSourceListStep } from "../image/imageSource/ImageSourceListStep";
import { IngressPromptStep } from "../ingress/IngressPromptStep";
import { ContainerAppCreateStep } from "./ContainerAppCreateStep";
import { ContainerAppNameStep } from "./ContainerAppNameStep";
import { type CreateContainerAppContext } from "./CreateContainerAppContext";
import { showContainerAppNotification } from "./showContainerAppNotification";

export async function createContainerApp(context: IActionContext, node?: ManagedEnvironmentItem): Promise<ContainerAppItem> {
    // If an incompatible tree item is passed, treat it as if no item was passed
    if (node && !ManagedEnvironmentItem.isManagedEnvironmentItem(node)) {
        node = undefined;
    }

    node ??= await pickEnvironment(context);

    const wizardContext: CreateContainerAppContext = {
        ...context,
        ...createSubscriptionContext(node.subscription),
        ...await createActivityContext(),
        subscription: node.subscription,
        managedEnvironmentId: node.managedEnvironment.id,
        alwaysPromptIngress: true
    };

    const title: string = localize('createContainerApp', 'Create container app');

    const promptSteps: AzureWizardPromptStep<CreateContainerAppContext>[] = [
        new ContainerAppNameStep(),
        new ImageSourceListStep(),
        new IngressPromptStep(),
    ];

    const executeSteps: AzureWizardExecuteStep<CreateContainerAppContext>[] = [
        getVerifyProvidersStep<CreateContainerAppContext>(),
        new ContainerAppCreateStep(),
    ];

    if (isAzdExtensionInstalled()) {
        context.telemetry.properties.isAzdWorkspaceProject = 'true';
    }

    // Use the same resource group and location as the parent resource (managed environment)
    const resourceGroupName: string = nonNullValueAndProp(node.resource, 'resourceGroup');
    const resourceGroups: ResourceGroup[] = await ResourceGroupListStep.getResourceGroups(wizardContext);
    wizardContext.resourceGroup = nonNullValue(resourceGroups.find(rg => rg.name === resourceGroupName));

    await LocationListStep.setLocation(wizardContext, nonNullProp(node.resource, 'location'));

    const wizard: AzureWizard<CreateContainerAppContext> = new AzureWizard(wizardContext, {
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
    if (!wizardContext.suppressNotification) {
        void showContainerAppNotification(createdContainerApp);
    }

    return new ContainerAppItem(node.subscription, createdContainerApp);
}
