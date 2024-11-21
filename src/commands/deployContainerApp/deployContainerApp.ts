/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ResourceGroup } from "@azure/arm-resources";
import { LocationListStep, ResourceGroupListStep } from "@microsoft/vscode-azext-azureutils";
import { AzureWizard, createSubscriptionContext, nonNullProp, nonNullValue, UserCancelledError, type IActionContext, type ISubscriptionActionContext, type ISubscriptionContext } from "@microsoft/vscode-azext-utils";
import { ImageSource } from "../../constants";
import { type ContainerAppItem } from "../../tree/ContainerAppItem";
import { createActivityContext } from "../../utils/activityUtils";
import { isAzdExtensionInstalled } from "../../utils/azdUtils";
import { getManagedEnvironmentFromContainerApp } from "../../utils/getResourceUtils";
import { getVerifyProvidersStep } from "../../utils/getVerifyProvidersStep";
import { localize } from "../../utils/localize";
import { pickContainerApp } from "../../utils/pickItem/pickContainerApp";
import { deployWorkspaceProject } from "../deployWorkspaceProject/deployWorkspaceProject";
import { ContainerAppUpdateStep } from "../image/imageSource/ContainerAppUpdateStep";
import { ImageSourceListStep } from "../image/imageSource/ImageSourceListStep";
import { type ContainerAppDeployContext } from "./ContainerAppDeployContext";

export async function deployContainerApp(context: IActionContext, node?: ContainerAppItem) {
    const item: ContainerAppItem = node ?? await pickContainerApp(context);
    const subscriptionContext: ISubscriptionContext = createSubscriptionContext(item.subscription);
    const subscriptionActionContext: ISubscriptionActionContext = { ...context, ...subscriptionContext };

    // Prompt for image source before initializing the wizard in case we need to redirect the call to 'deployWorkspaceProject' instead
    const imageSource: ImageSource = await promptImageSource(subscriptionActionContext);
    if (imageSource === ImageSource.RemoteAcrBuild) {
        // Add generic return for deploy call that roughly matches the deployWorkspaceProjectResults
        // Also check how we want to differentiate this version of deployment from update container...
        void deployWorkspaceProject(context, item);
        throw new UserCancelledError();
    }

    const wizardContext: ContainerAppDeployContext = {
        ...subscriptionActionContext,
        ...await createActivityContext(true),
        subscription: item.subscription,
        managedEnvironment: await getManagedEnvironmentFromContainerApp(subscriptionActionContext, item.containerApp),
        imageSource,
    };

    if (isAzdExtensionInstalled()) {
        wizardContext.telemetry.properties.isAzdExtensionInstalled = 'true';
    }

    const resourceGroups: ResourceGroup[] = await ResourceGroupListStep.getResourceGroups(wizardContext);
    wizardContext.resourceGroup = nonNullValue(
        resourceGroups.find(rg => rg.name === item.containerApp.resourceGroup),
        localize('containerAppResourceGroup', 'Expected to find the container app\'s resource group.'),
    );

    await LocationListStep.setLocation(wizardContext, item.containerApp.location);

    const wizard: AzureWizard<ContainerAppDeployContext> = new AzureWizard(wizardContext, {
        title: localize('deployContainerApp', 'Deploy to container app'),
        promptSteps: [
            new ImageSourceListStep(),
        ],
        executeSteps: [
            getVerifyProvidersStep<ContainerAppDeployContext>(),
            new ContainerAppUpdateStep(),
        ],
        showLoadingPrompt: true
    });

    await wizard.prompt();
    await wizard.execute();
}

async function promptImageSource(context: ISubscriptionActionContext): Promise<ImageSource> {
    const promptContext: ISubscriptionActionContext & { imageSource?: ImageSource } = context;

    const imageSourceStep: ImageSourceListStep = new ImageSourceListStep();
    await imageSourceStep.prompt(promptContext);

    return nonNullProp(promptContext, 'imageSource');
}
