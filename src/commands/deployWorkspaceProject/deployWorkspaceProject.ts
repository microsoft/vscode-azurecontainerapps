/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { LocationListStep, ResourceGroupCreateStep, VerifyProvidersStep } from "@microsoft/vscode-azext-azureutils";
import { AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, GenericTreeItem, IActionContext, ISubscriptionContext, callWithTelemetryAndErrorHandling, createSubscriptionContext, nonNullProp, nonNullValueAndProp, subscriptionExperience } from "@microsoft/vscode-azext-utils";
import type { AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { ProgressLocation, window } from "vscode";
import { activityInfoIcon, activitySuccessContext, appProvider, managedEnvironmentsId, operationalInsightsProvider, webProvider } from "../../constants";
import { ext } from "../../extensionVariables";
import { SetTelemetryProps } from "../../telemetry/SetTelemetryProps";
import { DeployWorkspaceProjectNotificationTelemetryProps as NotificationTelemetryProps } from "../../telemetry/telemetryProps";
import { ContainerAppItem, ContainerAppModel, isIngressEnabled } from "../../tree/ContainerAppItem";
import { ManagedEnvironmentItem } from "../../tree/ManagedEnvironmentItem";
import { createActivityChildContext, createActivityContext } from "../../utils/activity/activityUtils";
import { localize } from "../../utils/localize";
import { ContainerAppOverwriteConfirmStep } from "../ContainerAppOverwriteConfirmStep";
import { browseContainerApp } from "../browseContainerApp";
import { ContainerAppCreateStep } from "../createContainerApp/ContainerAppCreateStep";
import { LogAnalyticsCreateStep } from "../createManagedEnvironment/LogAnalyticsCreateStep";
import { ManagedEnvironmentCreateStep } from "../createManagedEnvironment/ManagedEnvironmentCreateStep";
import { ContainerAppUpdateStep } from "../image/imageSource/ContainerAppUpdateStep";
import { ImageSourceListStep } from "../image/imageSource/ImageSourceListStep";
import { IngressPromptStep } from "../ingress/IngressPromptStep";
import { DeployWorkspaceProjectConfirmStep } from "./DeployWorkspaceProjectConfirmStep";
import type { DeployWorkspaceProjectContext } from "./DeployWorkspaceProjectContext";
import { DeployWorkspaceProjectSaveSettingsStep } from "./DeployWorkspaceProjectSaveSettingsStep";
import { ShouldSaveDeploySettingsPromptStep } from "./ShouldSaveDeploySettingsPromptStep";
import { DefaultResourcesNameStep } from "./getDefaultValues/DefaultResourcesNameStep";
import { getDefaultContextValues } from "./getDefaultValues/getDefaultContextValues";

export async function deployWorkspaceProject(context: IActionContext, item?: ContainerAppItem | ManagedEnvironmentItem): Promise<void> {
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
        defaultContextValues = await getDefaultContextValues({ ...context, ...subscriptionContext }, item);
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

    // Resource group
    if (wizardContext.resourceGroup) {
        wizardContext.telemetry.properties.existingResourceGroup = 'true';

        const resourceGroupName: string = nonNullValueAndProp(wizardContext.resourceGroup, 'name');

        wizardContext.activityChildren?.push(
            new GenericTreeItem(undefined, {
                contextValue: createActivityChildContext(['useExistingResourceGroup', activitySuccessContext]),
                label: localize('useResourceGroup', 'Using resource group "{0}"', resourceGroupName),
                iconPath: activityInfoIcon
            })
        );

        await LocationListStep.setLocation(wizardContext, wizardContext.resourceGroup.location);
        ext.outputChannel.appendLog(localize('usingResourceGroup', 'Using resource group "{0}".', resourceGroupName));
    } else {
        wizardContext.telemetry.properties.existingResourceGroup = 'false';
        executeSteps.push(new ResourceGroupCreateStep());
    }

    // Managed environment
    if (wizardContext.managedEnvironment) {
        wizardContext.telemetry.properties.existingEnvironment = 'true';

        const managedEnvironmentName: string = nonNullValueAndProp(wizardContext.managedEnvironment, 'name');

        wizardContext.activityChildren?.push(
            new GenericTreeItem(undefined, {
                contextValue: createActivityChildContext(['useExistingManagedEnvironment', activitySuccessContext]),
                label: localize('useManagedEnvironment', 'Using container apps environment "{0}"', managedEnvironmentName),
                iconPath: activityInfoIcon
            })
        );

        if (!LocationListStep.hasLocation(wizardContext)) {
            await LocationListStep.setLocation(wizardContext, wizardContext.managedEnvironment.location);
        }

        ext.outputChannel.appendLog(localize('usingManagedEnvironment', 'Using container apps environment "{0}".', managedEnvironmentName));
    } else {
        wizardContext.telemetry.properties.existingEnvironment = 'false';

        executeSteps.push(
            new LogAnalyticsCreateStep(),
            new ManagedEnvironmentCreateStep()
        );

        providers.push(
            appProvider,
            operationalInsightsProvider
        );
    }

    // Azure Container Registry
    if (wizardContext.registry) {
        wizardContext.telemetry.properties.existingRegistry = 'true';

        const registryName: string = nonNullValueAndProp(wizardContext.registry, 'name');

        wizardContext.activityChildren?.push(
            new GenericTreeItem(undefined, {
                contextValue: createActivityChildContext(['useExistingAcr', activitySuccessContext]),
                label: localize('useAcr', 'Using container registry "{0}"', registryName),
                iconPath: activityInfoIcon
            })
        );

        ext.outputChannel.appendLog(localize('usingAcr', 'Using Azure Container Registry "{0}".', registryName));
    } else {
        wizardContext.telemetry.properties.existingRegistry = 'false';
        // ImageSourceListStep can already handle this creation logic
    }

    // Container app
    if (wizardContext.containerApp) {
        wizardContext.telemetry.properties.existingContainerApp = 'true';

        const containerAppName: string = nonNullValueAndProp(wizardContext.containerApp, 'name');

        promptSteps.unshift(new ContainerAppOverwriteConfirmStep());
        executeSteps.push(new ContainerAppUpdateStep());

        wizardContext.activityChildren?.push(
            new GenericTreeItem(undefined, {
                contextValue: createActivityChildContext(['useExistingContainerApp', activitySuccessContext]),
                label: localize('useContainerApp', 'Using container app "{0}"', containerAppName),
                iconPath: activityInfoIcon
            })
        );

        ext.outputChannel.appendLog(localize('usingContainerApp', 'Using container app "{0}".', containerAppName));

        if (!LocationListStep.hasLocation(wizardContext)) {
            await LocationListStep.setLocation(wizardContext, wizardContext.containerApp.location);
        }
    } else {
        wizardContext.telemetry.properties.existingContainerApp = 'false';
        executeSteps.push(new ContainerAppCreateStep());
    }

    promptSteps.push(
        new ImageSourceListStep(),
        new IngressPromptStep(),
    );

    providers.push(webProvider);

    // Verify providers
    executeSteps.push(new VerifyProvidersStep(providers));

    // Location
    if (LocationListStep.hasLocation(wizardContext)) {
        wizardContext.telemetry.properties.existingLocation = 'true';
        ext.outputChannel.appendLog(localize('useLocation', 'Using location "{0}".', (await LocationListStep.getLocation(wizardContext)).name));
    } else {
        wizardContext.telemetry.properties.existingLocation = 'false';
        LocationListStep.addProviderForFiltering(wizardContext, appProvider, managedEnvironmentsId);
        LocationListStep.addStep(wizardContext, promptSteps);
    }

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
    wizardContext.telemetry.properties.revisionMode = wizardContext.containerApp?.revisionsMode;

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
        await callWithTelemetryAndErrorHandling('deployWorkspaceProject.displayNotification',
            async (telemetryContext: IActionContext & SetTelemetryProps<NotificationTelemetryProps>) => {
                if (result === viewOutput) {
                    telemetryContext.telemetry.properties.userAction = 'viewOutput';
                    ext.outputChannel.show();
                } else if (result === browse) {
                    telemetryContext.telemetry.properties.userAction = 'browse';
                    await browseContainerApp(containerApp);
                } else {
                    telemetryContext.telemetry.properties.userAction = 'canceled';
                }
            }
        );
    });

    // Provide browse link automatically to output channel
    if (isIngressEnabled(containerApp)) {
        ext.outputChannel.appendLog(localize('browseContainerApp', 'Deployed to: {0}', `https://${containerApp.configuration.ingress.fqdn}`));
    }
}
