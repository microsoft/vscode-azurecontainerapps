/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode } from "@azure/arm-appcontainers";
import { type ResourceGroup } from "@azure/arm-resources";
import { LocationListStep, ResourceGroupListStep } from "@microsoft/vscode-azext-azureutils";
import { activityInfoIcon, activitySuccessContext, AzureWizard, createSubscriptionContext, createUniversallyUniqueContextValue, GenericTreeItem, nonNullProp, nonNullValue, type IActionContext, type ISubscriptionActionContext, type ISubscriptionContext } from "@microsoft/vscode-azext-utils";
import { ImageSource } from "../../constants";
import { ext } from "../../extensionVariables";
import { type ContainerAppItem } from "../../tree/ContainerAppItem";
import { createActivityContext } from "../../utils/activityUtils";
import { isAzdExtensionInstalled } from "../../utils/azdUtils";
import { getManagedEnvironmentFromContainerApp } from "../../utils/getResourceUtils";
import { getVerifyProvidersStep } from "../../utils/getVerifyProvidersStep";
import { localize } from "../../utils/localize";
import { pickContainerApp } from "../../utils/pickItem/pickContainerApp";
import { deployWorkspaceProject } from "../deployWorkspaceProject/deployWorkspaceProject";
import { editContainerCommandName } from "../editContainer/editContainer";
import { ContainerAppUpdateStep } from "../image/imageSource/ContainerAppUpdateStep";
import { ImageSourceListStep } from "../image/imageSource/ImageSourceListStep";
import { type ContainerAppDeployContext } from "./ContainerAppDeployContext";

const deployContainerAppCommandName: string = localize('deployContainerApp', 'Deploy to Container App...');

export async function deployContainerApp(context: IActionContext, node?: ContainerAppItem): Promise<void> {
    const item: ContainerAppItem = node ?? await pickContainerApp(context);
    const subscriptionContext: ISubscriptionContext = createSubscriptionContext(item.subscription);
    const subscriptionActionContext: ISubscriptionActionContext = { ...context, ...subscriptionContext };

    if (item.containerApp.revisionsMode === KnownActiveRevisionsMode.Multiple) {
        throw new Error(localize('multipleRevisionsNotSupported', 'The container app "{0}" cannot be updated using "{1}" while in multiple revisions mode. Navigate to the revision\'s container and execute "{2}" instead.', item.containerApp.name, deployContainerAppCommandName, editContainerCommandName));
    }
    if ((item.containerApp.template?.containers?.length ?? 0) > 1) {
        throw new Error(localize('multipleContainersNotSupported', 'The container app "{0}" cannot be updated using "{1}" while having more than one active container. Navigate to the specific container instance and execute "{2}" instead.', item.containerApp.name, deployContainerAppCommandName, editContainerCommandName));
    }

    // Prompt for image source before initializing the wizard in case we need to redirect the call to 'deployWorkspaceProject' instead
    const imageSource: ImageSource = await promptImageSource(subscriptionActionContext);
    if (imageSource === ImageSource.RemoteAcrBuild) {
        await deployWorkspaceProject(context, item);
        return;
    }

    const wizardContext: ContainerAppDeployContext = {
        ...subscriptionActionContext,
        ...await createActivityContext(true),
        subscription: item.subscription,
        containerApp: item.containerApp,
        managedEnvironment: await getManagedEnvironmentFromContainerApp(subscriptionActionContext, item.containerApp),
        imageSource,
    };
    wizardContext.telemetry.properties.revisionMode = item.containerApp.revisionsMode;

    if (isAzdExtensionInstalled()) {
        wizardContext.telemetry.properties.isAzdExtensionInstalled = 'true';
    }

    const resourceGroups: ResourceGroup[] = await ResourceGroupListStep.getResourceGroups(wizardContext);
    wizardContext.resourceGroup = nonNullValue(
        resourceGroups.find(rg => rg.name === item.containerApp.resourceGroup),
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

    await LocationListStep.setLocation(wizardContext, item.containerApp.location);

    const wizard: AzureWizard<ContainerAppDeployContext> = new AzureWizard(wizardContext, {
        title: localize('deployContainerAppTitle', 'Deploy image to container app'),
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
    wizardContext.activityTitle = localize('deployContainerAppActivityTitle', 'Deploy image to container app "{0}"', wizardContext.containerApp?.name);
    await wizard.execute();
}

async function promptImageSource(context: ISubscriptionActionContext): Promise<ImageSource> {
    const promptContext: ISubscriptionActionContext & { imageSource?: ImageSource } = context;

    const imageSourceStep: ImageSourceListStep = new ImageSourceListStep();
    await imageSourceStep.prompt(promptContext);

    return nonNullProp(promptContext, 'imageSource');
}
