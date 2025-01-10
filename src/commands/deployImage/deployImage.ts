/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type ResourceGroup } from "@azure/arm-resources";
import { LocationListStep, ResourceGroupListStep } from "@microsoft/vscode-azext-azureutils";
import { activityInfoIcon, activitySuccessContext, AzureWizard, createSubscriptionContext, createUniversallyUniqueContextValue, GenericTreeItem, nonNullValue, nonNullValueAndProp, type IActionContext, type ISubscriptionContext } from "@microsoft/vscode-azext-utils";
import { ext } from "../../extensionVariables";
import { type ContainerItem } from "../../tree/containers/ContainerItem";
import { createActivityContext } from "../../utils/activityUtils";
import { isAzdExtensionInstalled } from "../../utils/azdUtils";
import { getManagedEnvironmentFromContainerApp } from "../../utils/getResourceUtils";
import { getVerifyProvidersStep } from "../../utils/getVerifyProvidersStep";
import { localize } from "../../utils/localize";
import { getParentResource } from "../../utils/revisionDraftUtils";
import { ContainerAppOverwriteConfirmStep } from "../ContainerAppOverwriteConfirmStep";
import { showContainerAppNotification } from "../createContainerApp/showContainerAppNotification";
import { ContainerAppUpdateStep } from "../image/imageSource/ContainerAppUpdateStep";
import { ImageSourceListStep } from "../image/imageSource/ImageSourceListStep";
import { type ContainerRegistryImageSourceContext } from "../image/imageSource/containerRegistry/ContainerRegistryImageSourceContext";
import { type DeployImageContext } from "./DeployImageContext";

export async function deployImage(context: IActionContext & Partial<ContainerRegistryImageSourceContext>, node: ContainerItem): Promise<void> {
    const { subscription, containerApp } = node;
    const subscriptionContext: ISubscriptionContext = createSubscriptionContext(subscription);

    const wizardContext: DeployImageContext = {
        ...context,
        ...subscriptionContext,
        ...await createActivityContext(true),
        subscription,
        managedEnvironment: await getManagedEnvironmentFromContainerApp({ ...context, ...subscriptionContext }, containerApp),
        containerApp,
        containersIdx: node.containersIdx,
        template: nonNullValueAndProp(getParentResource(containerApp, node.revision), 'template'),
    };

    if (isAzdExtensionInstalled()) {
        wizardContext.telemetry.properties.isAzdExtensionInstalled = 'true';
    }

    const resourceGroups: ResourceGroup[] = await ResourceGroupListStep.getResourceGroups(wizardContext);
    wizardContext.resourceGroup = nonNullValue(
        resourceGroups.find(rg => rg.name === containerApp.resourceGroup),
        localize('containerAppResourceGroup', 'Expected to find the container app\'s resource group.'),
    );

    // Log resource group
    wizardContext.activityChildren?.push(
        new GenericTreeItem(undefined, {
            contextValue: createUniversallyUniqueContextValue(['useExistingResourceGroupInfoItem', activitySuccessContext]),
            label: localize('useResourceGroup', 'Using resource group "{0}"', wizardContext.resourceGroup.name),
            iconPath: activityInfoIcon
        })
    );
    ext.outputChannel.appendLog(localize('usingResourceGroup', 'Using resource group "{0}".', wizardContext.resourceGroup.name));

    // Log container app
    wizardContext.activityChildren?.push(
        new GenericTreeItem(undefined, {
            contextValue: createUniversallyUniqueContextValue(['useExistingContainerAppInfoItem', activitySuccessContext]),
            label: localize('useContainerApp', 'Using container app "{0}"', wizardContext.containerApp?.name),
            iconPath: activityInfoIcon
        })
    );
    ext.outputChannel.appendLog(localize('usingContainerApp', 'Using container app "{0}".', wizardContext.containerApp?.name));

    await LocationListStep.setLocation(wizardContext, containerApp.location);

    const parentResourceName: string = getParentResource(containerApp, node.revision).name ?? containerApp.name;
    const wizard: AzureWizard<DeployImageContext> = new AzureWizard(wizardContext, {
        title: localize('deployImageTitle', 'Deploy image to "{0}"', parentResourceName),
        promptSteps: [
            new ImageSourceListStep(),
            new ContainerAppOverwriteConfirmStep(),
        ],
        executeSteps: [
            getVerifyProvidersStep<DeployImageContext>(),
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
