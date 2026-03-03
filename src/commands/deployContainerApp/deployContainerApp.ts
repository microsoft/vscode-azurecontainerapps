/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode } from "@azure/arm-appcontainers";
import { AzExtUserInput, AzureWizard, createSubscriptionContext, isCopilotUserInput, nonNullProp, type AzureWizardPromptStep, type IActionContext, type ISubscriptionActionContext, type ISubscriptionContext } from "@microsoft/vscode-azext-utils";
import { type AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { acrDomain, ImageSource, SupportedRegistries } from "../../constants";
import { type ContainerAppItem } from "../../tree/ContainerAppItem";
import { createActivityContext } from "../../utils/activityUtils";
import { isAzdExtensionInstalled } from "../../utils/azdUtils";
import { getManagedEnvironmentFromContainerApp } from "../../utils/getResourceUtils";
import { getVerifyProvidersStep } from "../../utils/getVerifyProvidersStep";
import { localize } from "../../utils/localize";
import { pickContainerApp } from "../../utils/pickItem/pickContainerApp";
import { OpenConfirmationViewStep } from "../../webviews/OpenConfirmationViewStep";
import { openLoadingViewPanel } from "../../webviews/OpenLoadingViewStep";
import { CommandAttributes } from "../CommandAttributes";
import { ContainerAppOverwriteConfirmStep } from "../ContainerAppOverwriteConfirmStep";
import { ContainerAppListStep } from "../createContainerApp/ContainerAppListStep";
import { ManagedEnvironmentListStep } from "../createManagedEnvironment/ManagedEnvironmentListStep";
import { deployWorkspaceProject } from "../deployWorkspaceProject/deployWorkspaceProject";
import { type DeployWorkspaceProjectResults } from "../deployWorkspaceProject/getDeployWorkspaceProjectResults";
import { editContainerCommandName } from "../editContainer/editContainer";
import { ContainerAppUpdateStep } from "../image/imageSource/ContainerAppUpdateStep";
import { ImageSourceListStep } from "../image/imageSource/ImageSourceListStep";
import { type ContainerAppDeployContext } from "./ContainerAppDeployContext";
import { ContainerAppDeployStartingResourcesLogStep } from "./ContainerAppDeployStartingResourcesLogStep";

const deployContainerAppCommandName: string = localize('deployContainerApp', 'Deploy to Container App...');

export async function deployContainerApp(context: IActionContext, node?: ContainerAppItem): Promise<DeployWorkspaceProjectResults | void> {
    const item: ContainerAppItem = node ?? await pickContainerApp(context);
    const subscriptionContext: ISubscriptionContext = createSubscriptionContext(item.subscription);
    const subscriptionActionContext: ISubscriptionActionContext = { ...context, ...subscriptionContext };

    if (item.containerApp.revisionsMode === KnownActiveRevisionsMode.Multiple) {
        throw new Error(localize('multipleRevisionsNotSupported', 'The container app cannot be updated using "{0}" while in multiple revisions mode. Navigate to the revision\'s container and execute "{1}" instead.', deployContainerAppCommandName, editContainerCommandName));
    }
    if ((item.containerApp.template?.containers?.length ?? 0) > 1) {
        throw new Error(localize('multipleContainersNotSupported', 'The container app cannot be updated using "{0}" while having more than one active container. Navigate to the specific container instance and execute "{1}" instead.', deployContainerAppCommandName, editContainerCommandName));
    }


    let imageSource: ImageSource | undefined;
    let registryDomain: SupportedRegistries | undefined;
    if (isCopilotUserInput(context)) {
        // If the input is coming from Copilot we want to default to Container Registry as we don't support 'deployWorkspaceProject' flow with Copilot at the moment
        imageSource = ImageSource.ContainerRegistry;
        registryDomain = acrDomain;
    } else {
        // Prompt for image source before initializing the wizard in case we need to redirect the call to 'deployWorkspaceProject' instead
        imageSource = await promptImageSource(subscriptionActionContext);
        if (imageSource === ImageSource.RemoteAcrBuild) {
            return await deployWorkspaceProject(context, item);
        }
    }
    return await deployContainerAppInternal(subscriptionActionContext, item, imageSource, registryDomain);
}

export async function deployContainerAppInternal(context: ISubscriptionActionContext, node?: ContainerAppItem, imageSource?: ImageSource, registryDomain?: SupportedRegistries): Promise<void> {
    if (isCopilotUserInput(context)) {
        await openLoadingViewPanel(context);
    }

    const subscription = (context as { azureSubscription?: AzureSubscription }).azureSubscription;

    if (!subscription && !node) {
        // If subscription does not exist revert to regular deploy flow
        context.ui = new AzExtUserInput(context);
        await deployContainerApp(context);
        return;
    }


    const promptSteps: AzureWizardPromptStep<ContainerAppDeployContext>[] = [];

    if (!node) {
        promptSteps.push(new ManagedEnvironmentListStep(), new ContainerAppListStep());
    }

    let wizardContext: ContainerAppDeployContext = {} as ContainerAppDeployContext;

    if (node && imageSource) {
        // If this command gets re run we only want the internal portion of the command to run, so we set the callbackid
        context.callbackId = 'containerApps.deployContainerAppInternal';
        wizardContext = {
            ...context,
            ...await createActivityContext({ withChildren: true }),
            subscription: node.subscription,
            containerApp: node.containerApp,
            managedEnvironment: await getManagedEnvironmentFromContainerApp(context, node.containerApp),
            imageSource,
            registryDomain,
            activityAttributes: {
                ...CommandAttributes.DeployContainerAppContainerRegistry,
                subscription: node.subscription,
            },
        };

        if (isAzdExtensionInstalled()) {
            wizardContext.telemetry.properties.isAzdExtensionInstalled = 'true';
        }
        wizardContext.telemetry.properties.revisionMode = node.containerApp.revisionsMode;
    } else if (subscription) {
        wizardContext = {
            ...context,
            ...await createActivityContext({ withChildren: true }),
            subscription: subscription,
            // at the moment we are only supporting re run with container registry image source
            imageSource: ImageSource.ContainerRegistry
        };
    }

    const confirmationViewTitle: string = localize('summary', 'Summary');
    let confirmationViewDescription: string = localize('viewDescription', 'Please select an input you would like to change. Note: Any input preceding the changed input will need to change as well');
    let confirmationViewTabTitle: string = localize('deployContainerAppTabTitle', 'Summary - Deploy Image to Container App');
    let title: string = localize('deployContainerAppTitle', 'Deploy image to container app');

    if (isCopilotUserInput(wizardContext)) {
        confirmationViewDescription = localize('viewDescription', 'Please review AI generated inputs and select any you would like to modify. Note: Any input preceding the modified input will need to change as well');
        confirmationViewTabTitle = localize('deployContainerAppTabTitle', 'Summary - Deploy Image to Container App using Copilot');
        title = localize('deployContainerAppWithCopilotTitle', 'Deploy image to container app using copilot');
    }

    promptSteps.push(
        new ContainerAppDeployStartingResourcesLogStep(),
        new ImageSourceListStep(),
        new ContainerAppOverwriteConfirmStep(),
        new OpenConfirmationViewStep(confirmationViewTitle, confirmationViewTabTitle, confirmationViewDescription, title, () => wizard.confirmationViewProperties)
    );

    const wizard = new AzureWizard<ContainerAppDeployContext>(wizardContext, {
        title: title,
        promptSteps: promptSteps,
        executeSteps: [
            getVerifyProvidersStep<ContainerAppDeployContext>(),
            new ContainerAppUpdateStep(),
        ],
    });

    await wizard.prompt();
    wizardContext.activityTitle = localize('deployContainerAppActivityTitle', 'Deploy image to container app "{0}"', wizardContext.containerApp?.name);
    await wizard.execute();

    wizardContext.activityAttributes ??= {};
    wizardContext.activityAttributes.azureResource = wizardContext.containerApp;
}

async function promptImageSource(context: ISubscriptionActionContext): Promise<ImageSource> {
    const promptContext: ISubscriptionActionContext & { imageSource?: ImageSource } = context;

    const imageSourceStep: ImageSourceListStep = new ImageSourceListStep();
    await imageSourceStep.prompt(promptContext);

    return nonNullProp(promptContext, 'imageSource');
}
