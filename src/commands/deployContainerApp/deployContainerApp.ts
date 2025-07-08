/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode } from "@azure/arm-appcontainers";
import { AzureWizard, createSubscriptionContext, nonNullProp, type IActionContext, type ISubscriptionActionContext, type ISubscriptionContext } from "@microsoft/vscode-azext-utils";
import { ImageSource } from "../../constants";
import { type ContainerAppItem } from "../../tree/ContainerAppItem";
import { createActivityContext } from "../../utils/activityUtils";
import { isAzdExtensionInstalled } from "../../utils/azdUtils";
import { getManagedEnvironmentFromContainerApp } from "../../utils/getResourceUtils";
import { getVerifyProvidersStep } from "../../utils/getVerifyProvidersStep";
import { localize } from "../../utils/localize";
import { pickContainerApp } from "../../utils/pickItem/pickContainerApp";
import { OpenConfirmationViewStep } from "../../webviews/OpenConfirmationViewStep";
import { ContainerAppOverwriteConfirmStep } from "../ContainerAppOverwriteConfirmStep";
import { deployWorkspaceProject } from "../deployWorkspaceProject/deployWorkspaceProject";
import { editContainerCommandName } from "../editContainer/editContainer";
import { ContainerAppUpdateStep } from "../image/imageSource/ContainerAppUpdateStep";
import { ImageSourceListStep } from "../image/imageSource/ImageSourceListStep";
import { type ContainerAppDeployContext } from "./ContainerAppDeployContext";
import { ContainerAppDeployStartingResourcesLogStep } from "./ContainerAppDeployStartingResourcesLogStep";

const deployContainerAppCommandName: string = localize('deployContainerApp', 'Deploy to Container App...');

export async function deployContainerApp(context: IActionContext, node?: ContainerAppItem): Promise<void> {
    const item: ContainerAppItem = node ?? await pickContainerApp(context);
    const subscriptionContext: ISubscriptionContext = createSubscriptionContext(item.subscription);
    const subscriptionActionContext: ISubscriptionActionContext = { ...context, ...subscriptionContext };

    if (item.containerApp.revisionsMode === KnownActiveRevisionsMode.Multiple) {
        throw new Error(localize('multipleRevisionsNotSupported', 'The container app cannot be updated using "{0}" while in multiple revisions mode. Navigate to the revision\'s container and execute "{1}" instead.', deployContainerAppCommandName, editContainerCommandName));
    }
    if ((item.containerApp.template?.containers?.length ?? 0) > 1) {
        throw new Error(localize('multipleContainersNotSupported', 'The container app cannot be updated using "{0}" while having more than one active container. Navigate to the specific container instance and execute "{1}" instead.', deployContainerAppCommandName, editContainerCommandName));
    }

    // Prompt for image source before initializing the wizard in case we need to redirect the call to 'deployWorkspaceProject' instead
    const imageSource: ImageSource = await promptImageSource(subscriptionActionContext);
    if (imageSource === ImageSource.RemoteAcrBuild) {
        await deployWorkspaceProject(context, item);
        return;
    }

    const wizardContext: ContainerAppDeployContext = {
        ...subscriptionActionContext,
        ...await createActivityContext({ withChildren: true }),
        subscription: item.subscription,
        containerApp: item.containerApp,
        managedEnvironment: await getManagedEnvironmentFromContainerApp(subscriptionActionContext, item.containerApp),
        imageSource,
    };

    if (isAzdExtensionInstalled()) {
        wizardContext.telemetry.properties.isAzdExtensionInstalled = 'true';
    }
    wizardContext.telemetry.properties.revisionMode = item.containerApp.revisionsMode;

    const confirmationViewTitle: string = localize('summary', 'Summary');
    const confirmationViewDescription: string = localize('viewDescription', 'Please select an input you would like to change. Otherwise click "Confirm" to deploy.');
    const confirmationViewTabTitle: string = localize('deployContainerAppTabTitle', 'Summary - Deploy Image to Container App');
    const title: string = localize('deployContainerAppTitle', 'Deploy image to container app');

    const wizard: AzureWizard<ContainerAppDeployContext> = new AzureWizard(wizardContext, {
        title: title,
        promptSteps: [
            new ContainerAppDeployStartingResourcesLogStep(),
            new ImageSourceListStep(),
            new ContainerAppOverwriteConfirmStep(),
            new OpenConfirmationViewStep(confirmationViewTitle, confirmationViewTabTitle, confirmationViewDescription, title, () => wizard.confirmationViewProperties)
        ],
        executeSteps: [
            getVerifyProvidersStep<ContainerAppDeployContext>(),
            new ContainerAppUpdateStep(),
        ],
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
