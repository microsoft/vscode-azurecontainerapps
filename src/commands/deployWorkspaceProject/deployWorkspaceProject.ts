/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { LocationListStep, ResourceGroupCreateStep, VerifyProvidersStep } from "@microsoft/vscode-azext-azureutils";
import { AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, GenericTreeItem, IActionContext, ISubscriptionContext, createSubscriptionContext, nonNullProp, nonNullValueAndProp, subscriptionExperience } from "@microsoft/vscode-azext-utils";
import type { AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { ProgressLocation, window } from "vscode";
import { activitySuccessContext, activitySuccessIcon, appProvider, managedEnvironmentsId, operationalInsightsProvider, webProvider } from "../../constants";
import { ext } from "../../extensionVariables";
import { ContainerAppModel, isIngressEnabled } from "../../tree/ContainerAppItem";
import { createActivityChildContext, createActivityContext } from "../../utils/activity/activityUtils";
import { localize } from "../../utils/localize";
import { browseContainerApp } from "../browseContainerApp";
import { ContainerAppCreateStep } from "../createContainerApp/ContainerAppCreateStep";
import { LogAnalyticsCreateStep } from "../createManagedEnvironment/LogAnalyticsCreateStep";
import { ManagedEnvironmentCreateStep } from "../createManagedEnvironment/ManagedEnvironmentCreateStep";
import { ContainerAppOverwriteConfirmStep } from "../deployImage/ContainerAppOverwriteConfirmStep";
import { ContainerAppUpdateStep } from "../deployImage/ContainerAppUpdateStep";
import { ImageSourceListStep } from "../deployImage/imageSource/ImageSourceListStep";
import { IngressPromptStep } from "../ingress/IngressPromptStep";
import { DeployWorkspaceProjectConfirmStep } from "./DeployWorkspaceProjectConfirmStep";
import type { DeployWorkspaceProjectContext } from "./DeployWorkspaceProjectContext";
import { DeployWorkspaceProjectSaveSettingsStep } from "./DeployWorkspaceProjectSaveSettingsStep";
import { ShouldSaveDeploySettingsPromptStep } from "./ShouldSaveDeploySettingsPromptStep";
import { DefaultResourcesNameStep } from "./getDefaultValues/DefaultResourcesNameStep";
import { getDefaultContextValues } from "./getDefaultValues/getDefaultContextValues";

export async function deployWorkspaceProject(context: IActionContext): Promise<void> {
    ext.outputChannel.appendLog(localize('beginCommandExecution', '--------Initializing deploy workspace project--------'));

    const subscription: AzureSubscription = await subscriptionExperience(context, ext.rgApiV2.resources.azureResourceTreeDataProvider);
    const subscriptionContext: ISubscriptionContext = createSubscriptionContext(subscription);

    // Show loading indicator while we configure default values
    let defaultContextValues: Partial<DeployWorkspaceProjectContext> | undefined;
    await window.withProgress({
        location: ProgressLocation.Notification,
        cancellable: false,
        title: localize('loadingWorkspaceTitle', 'Loading workspace project deployment configurations...')
    }, async () => {
        defaultContextValues = await getDefaultContextValues({ ...context, ...subscriptionContext });
    });

    const wizardContext: DeployWorkspaceProjectContext = {
        ...context,
        ...subscriptionContext,
        ...await createActivityContext(),
        ...defaultContextValues,
        activityChildren: [],
        subscription,
    };

    const promptSteps: AzureWizardPromptStep<DeployWorkspaceProjectContext>[] = [
        new DeployWorkspaceProjectConfirmStep(),
        new DefaultResourcesNameStep()
    ];

    const executeSteps: AzureWizardExecuteStep<DeployWorkspaceProjectContext>[] = [
        new DeployWorkspaceProjectSaveSettingsStep()
    ];

    const providers: string[] = [];

    // Resource Group
    if (wizardContext.resourceGroup) {
        const resourceGroupName: string = nonNullValueAndProp(wizardContext.resourceGroup, 'name');

        wizardContext.activityChildren?.push(
            new GenericTreeItem(undefined, {
                contextValue: createActivityChildContext(['useExistingResourceGroup', activitySuccessContext]),
                label: localize('useResourceGroup', 'Use resource group "{0}"', resourceGroupName),
                iconPath: activitySuccessIcon
            })
        );

        await LocationListStep.setLocation(wizardContext, wizardContext.resourceGroup.location);
        ext.outputChannel.appendLog(localize('usingResourceGroup', 'Using resource group "{0}".', resourceGroupName));
    } else {
        executeSteps.push(new ResourceGroupCreateStep());
    }

    // Managed Environment
    if (wizardContext.managedEnvironment) {
        const managedEnvironmentName: string = nonNullValueAndProp(wizardContext.managedEnvironment, 'name');

        wizardContext.activityChildren?.push(
            new GenericTreeItem(undefined, {
                contextValue: createActivityChildContext(['useExistingManagedEnvironment', activitySuccessContext]),
                label: localize('useManagedEnvironment', 'Use container app environment "{0}"', managedEnvironmentName),
                iconPath: activitySuccessIcon
            })
        );

        await LocationListStep.setLocation(wizardContext, wizardContext.managedEnvironment.location);

        ext.outputChannel.appendLog(localize('usingManagedEnvironment', 'Using container app environment "{0}".', managedEnvironmentName));
        ext.outputChannel.appendLog(localize('useLocation', 'Using location "{0}".', wizardContext.managedEnvironment.location));
    } else {
        executeSteps.push(
            new LogAnalyticsCreateStep(),
            new ManagedEnvironmentCreateStep()
        );

        providers.push(
            appProvider,
            operationalInsightsProvider
        );

        LocationListStep.addProviderForFiltering(wizardContext, appProvider, managedEnvironmentsId);
        LocationListStep.addStep(wizardContext, promptSteps);
    }

    // Azure Container Registry
    if (wizardContext.registry) {
        const registryName: string = nonNullValueAndProp(wizardContext.registry, 'name');

        wizardContext.activityChildren?.push(
            new GenericTreeItem(undefined, {
                contextValue: createActivityChildContext(['useExistingAcr', activitySuccessContext]),
                label: localize('useAcr', 'Use container registry "{0}"', registryName),
                iconPath: activitySuccessIcon
            })
        );

        ext.outputChannel.appendLog(localize('usingAcr', 'Using Azure Container Registry "{0}".', registryName));
    } else {
        // ImageSourceListStep can already handle this creation logic
    }

    // Container App
    if (wizardContext.containerApp) {
        const containerAppName: string = nonNullValueAndProp(wizardContext.containerApp, 'name');

        promptSteps.unshift(new ContainerAppOverwriteConfirmStep());
        executeSteps.push(new ContainerAppUpdateStep());

        wizardContext.activityChildren?.push(
            new GenericTreeItem(undefined, {
                contextValue: createActivityChildContext(['useExistingContainerApp', activitySuccessContext]),
                label: localize('useContainerApp', 'Use container app "{0}"', containerAppName),
                iconPath: activitySuccessIcon
            })
        );

        ext.outputChannel.appendLog(localize('usingContainerApp', 'Using container app "{0}".', containerAppName));
    } else {
        executeSteps.push(new ContainerAppCreateStep());
    }

    promptSteps.push(
        new ImageSourceListStep(),
        new IngressPromptStep(),
    );

    providers.push(webProvider);

    // Verify Providers
    executeSteps.push(new VerifyProvidersStep(providers));

    // Save deploy settings
    promptSteps.push(new ShouldSaveDeploySettingsPromptStep());

    const wizard: AzureWizard<DeployWorkspaceProjectContext> = new AzureWizard(wizardContext, {
        title: localize('deployWorkspaceProjectTitle', 'Deploy workspace project to a container app'),
        promptSteps,
        executeSteps,
        showLoadingPrompt: true
    });

    await wizard.prompt();

    wizardContext.activityTitle = localize('deployWorkspaceProjectActivityTitle', 'Deploy workspace project to container app "{0}"', wizardContext.containerApp?.name || nonNullProp(wizardContext, 'newContainerAppName'));

    ext.outputChannel.appendLog(localize('beginCommandExecution', '--------Deploying workspace project to container app--------', wizardContext.containerApp?.name || nonNullProp(wizardContext, 'newContainerAppName')));
    await wizard.execute();

    displayNotification(wizardContext);
    ext.branchDataProvider.refresh();

    ext.outputChannel.appendLog(localize('finishCommandExecution', '--------Finished deploying workspace project to container app "{0}"--------', wizardContext.containerApp?.name));
}

function displayNotification(context: DeployWorkspaceProjectContext): void {
    const browse: string = localize('browse', 'Browse');
    const viewOutput: string = localize('viewOutput', 'View Output');

    const message: string = localize('finishedDeploying', 'Finished deploying workspace project to container app "{0}".', context.containerApp?.name);
    const buttonMessages: string[] = context.targetPort ? [browse, viewOutput] : [viewOutput];

    const containerApp: ContainerAppModel = nonNullProp(context, 'containerApp');
    void window.showInformationMessage(message, ...buttonMessages).then(async (result: string | undefined) => {
        if (result === viewOutput) {
            ext.outputChannel.show();
        } else if (result === browse) {
            await browseContainerApp(containerApp);
        }
    });

    // Provide browse link automatically to output channel
    if (isIngressEnabled(containerApp)) {
        ext.outputChannel.appendLog(localize('browseContainerApp', 'Deployed to: {0}', `https://${containerApp.configuration.ingress.fqdn}`));
    }
}
