/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { LocationListStep, ResourceGroupCreateStep, VerifyProvidersStep } from "@microsoft/vscode-azext-azureutils";
import { AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, GenericTreeItem, IActionContext, ISubscriptionContext, createSubscriptionContext, nonNullProp, nonNullValueAndProp, subscriptionExperience } from "@microsoft/vscode-azext-utils";
import { AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { ProgressLocation, ThemeColor, ThemeIcon, window } from "vscode";
import { activitySuccessContext, activitySuccessIcon, appProvider, managedEnvironmentsId, operationalInsightsProvider, webProvider } from "../../constants";
import { ext } from "../../extensionVariables";
import { createActivityChildContext, createActivityContext } from "../../utils/activityUtils";
import { localize } from "../../utils/localize";
import { browseContainerApp } from "../browseContainerApp";
import { ContainerAppCreateStep } from "../createContainerApp/ContainerAppCreateStep";
import { LogAnalyticsCreateStep } from "../createManagedEnvironment/LogAnalyticsCreateStep";
import { ManagedEnvironmentCreateStep } from "../createManagedEnvironment/ManagedEnvironmentCreateStep";
import { ContainerAppOverwriteConfirmStep } from "../deployImage/ContainerAppOverwriteConfirmStep";
import { ContainerAppUpdateStep } from "../deployImage/ContainerAppUpdateStep";
import { ImageSourceListStep } from "../deployImage/imageSource/ImageSourceListStep";
import { RegistryEnableAdminUserStep } from "../deployImage/imageSource/containerRegistry/acr/RegistryEnableAdminUserStep";
import { RegistryCreateStep } from "../deployImage/imageSource/containerRegistry/acr/createAcr/RegistryCreateStep";
import { IngressPromptStep } from "../ingress/IngressPromptStep";
import { DeployWorkspaceProjectConfirmStep } from "./DeployWorkspaceProjectConfirmStep";
import { DeployWorkspaceProjectSaveSettingsStep } from "./DeployWorkspaceProjectSaveSettingsStep";
import { IDeployWorkspaceProjectContext } from "./IDeployWorkspaceProjectContext";
import { ShouldSaveSettingsPromptStep } from "./ShouldSaveSettingsPromptStep";
import { getDefaultContextValues } from "./getDefaultValues/getDefaultContextValues";

export async function deployWorkspaceProject(context: IActionContext): Promise<void> {
    ext.outputChannel.appendLog(localize('beginCommandExecution', '--------Initializing deploy workspace project--------'));

    const subscription: AzureSubscription = await subscriptionExperience(context, ext.rgApiV2.resources.azureResourceTreeDataProvider);
    const subscriptionContext: ISubscriptionContext = createSubscriptionContext(subscription);

    // Show loading indicator while we configure default values
    let defaultContextValues: Partial<IDeployWorkspaceProjectContext> | undefined;
    await window.withProgress({
        location: ProgressLocation.Notification,
        cancellable: false,
        title: localize('loadingWorkspaceTitle', 'Loading workspace project deployment configurations...')
    }, async () => {
        defaultContextValues = await getDefaultContextValues({ ...context, ...subscriptionContext });
    });

    const wizardContext: IDeployWorkspaceProjectContext = {
        ...context,
        ...subscriptionContext,
        ...await createActivityContext(),
        ...defaultContextValues,
        activityChildren: [],
        subscription,
    };

    const promptSteps: AzureWizardPromptStep<IDeployWorkspaceProjectContext>[] = [
        new DeployWorkspaceProjectConfirmStep(),
        new ShouldSaveSettingsPromptStep()
        // getDefaultResourceNamesStep
    ];

    const executeSteps: AzureWizardExecuteStep<IDeployWorkspaceProjectContext>[] = [
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
        promptSteps.push(new RegistryEnableAdminUserStep());

        wizardContext.activityChildren?.push(
            new GenericTreeItem(undefined, {
                contextValue: createActivityChildContext(['useExistingAcr', activitySuccessContext]),
                label: localize('useAcr', 'Use container registry "{0}"', wizardContext.registry.name),
                iconPath: activitySuccessIcon
            })
        );

        ext.outputChannel.appendLog(localize('usingAcr', 'Using container registry "{0}".', wizardContext.registry.name));
    } else {
        executeSteps.push(new RegistryCreateStep());
    }

    // Container App
    if (wizardContext.containerApp) {
        promptSteps.unshift(new ContainerAppOverwriteConfirmStep());
        executeSteps.push(new ContainerAppUpdateStep());

        const containerAppName: string = nonNullValueAndProp(wizardContext.containerApp, 'name');
        wizardContext.activityChildren?.push(
            new GenericTreeItem(undefined, {
                contextValue: createActivityChildContext(['useExistingContainerApp', activitySuccessContext]),
                label: localize('useContainerApp', 'Use container app "{0}"', containerAppName),
                iconPath: new ThemeIcon('pass', new ThemeColor('testing.iconPassed'))
            })
        );

        ext.outputChannel.appendLog(localize('usingContainerApp', 'Using container app "{0}".', wizardContext.containerApp.name));
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

    const wizard: AzureWizard<IDeployWorkspaceProjectContext> = new AzureWizard(wizardContext, {
        title: localize('deployWorkspaceProjectTitle', 'Deploy workspace project to a container app'),
        promptSteps,
        executeSteps,
        showLoadingPrompt: true
    });

    await wizard.prompt();

    wizardContext.activityTitle = localize('deployWorkspaceProjectActivityTitle', 'Deploy workspace project to container app "{0}"', wizardContext.containerApp?.name || nonNullProp(wizardContext, 'newContainerAppName'));

    ext.outputChannel.appendLog(localize('beginCommandExecution', '--------Deploying workspace project to container app--------', wizardContext.containerApp?.name || nonNullProp(wizardContext, 'newContainerAppName')));
    await wizard.execute();
    ext.outputChannel.appendLog(localize('finishCommandExecution', '--------Finished deploying workspace project to container app "{0}"--------', wizardContext.containerApp?.name));

    displayNotification(wizardContext);
    ext.branchDataProvider.refresh();
}

function displayNotification(context: IDeployWorkspaceProjectContext): void {
    const browse: string = localize('browse', 'Browse');
    const viewOutput: string = localize('viewOutput', 'View Output');

    const message: string = localize('finishedDeploying', 'Finished deploying workspace project to container app "{0}".', context.containerApp?.name);
    const buttonMessages: string[] = context.targetPort ? [browse, viewOutput] : [viewOutput];

    void window.showInformationMessage(message, ...buttonMessages).then(async (result: string | undefined) => {
        if (result === viewOutput) {
            ext.outputChannel.show();
        } else if (result === browse) {
            await browseContainerApp(nonNullProp(context, 'containerApp'));
        }
    });
}
