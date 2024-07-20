/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { LocationListStep, ResourceGroupCreateStep } from "@microsoft/vscode-azext-azureutils";
import { AzureWizard, nonNullValueAndProp, type AzureWizardExecuteStep, type AzureWizardPromptStep, type ExecuteActivityContext } from "@microsoft/vscode-azext-utils";
import { ProgressLocation, window } from "vscode";
import { appProvider, managedEnvironmentsId } from "../../../constants";
import { ext } from "../../../extensionVariables";
import { createActivityContext } from "../../../utils/activity/activityUtils";
import { getVerifyProvidersStep } from "../../../utils/getVerifyProvidersStep";
import { localize } from "../../../utils/localize";
import { logExistingContainerApp, logExistingContainerRegistry, logExistingEnvironment, logExistingResourceGroup } from "../../../utils/logExistingResource";
import { ContainerAppCreateStep } from "../../createContainerApp/ContainerAppCreateStep";
import { LogAnalyticsCreateStep } from "../../createManagedEnvironment/LogAnalyticsCreateStep";
import { ManagedEnvironmentCreateStep } from "../../createManagedEnvironment/ManagedEnvironmentCreateStep";
import { ContainerAppUpdateStep } from "../../image/imageSource/ContainerAppUpdateStep";
import { ImageSourceListStep } from "../../image/imageSource/ImageSourceListStep";
import { IngressPromptStep } from "../../ingress/IngressPromptStep";
import { formatSectionHeader } from "../formatSectionHeader";
import { AppResourcesNameStep } from "./AppResourcesNameStep";
import { DeployWorkspaceProjectConfirmStep } from "./DeployWorkspaceProjectConfirmStep";
import { type DeployWorkspaceProjectInternalContext } from "./DeployWorkspaceProjectInternalContext";
import { DeployWorkspaceProjectSaveSettingsStep } from "./DeployWorkspaceProjectSaveSettingsStep";
import { SharedResourcesNameStep } from "./SharedResourcesNameStep";
import { ShouldSaveDeploySettingsPromptStep } from "./ShouldSaveDeploySettingsPromptStep";
import { getStartingConfiguration } from "./startingConfiguration/getStartingConfiguration";

export interface DeployWorkspaceProjectInternalOptions {
    /**
     * Suppress showing the wizard execution through the activity log
     */
    suppressActivity?: boolean;
    /**
     * Suppress any [resource] confirmation prompts
     */
    suppressConfirmation?: boolean;
    /**
     * Suppress the creation of a container app (last potential resource creation step in the process)
     */
    suppressContainerAppCreation?: boolean;
    /**
     * Suppress loading progress notification
     */
    suppressProgress?: boolean;
    /**
     * Suppress the default wizard [prompting] title
     */
    suppressWizardTitle?: boolean;
}

export async function deployWorkspaceProjectInternal(
    context: DeployWorkspaceProjectInternalContext,
    options: DeployWorkspaceProjectInternalOptions
): Promise<DeployWorkspaceProjectInternalContext> {

    ext.outputChannel.appendLog(
        formatSectionHeader(localize('initCommandExecution', 'Initialize deploy workspace project'))
    );

    let activityContext: Partial<ExecuteActivityContext>;
    if (options.suppressActivity) {
        activityContext = { suppressNotification: true };
    } else {
        activityContext = await createActivityContext();
        activityContext.activityChildren = [];
    }

    // Show loading indicator while we configure starting values
    let startingConfiguration: Partial<DeployWorkspaceProjectInternalContext> | undefined;
    await window.withProgress({
        location: ProgressLocation.Notification,
        cancellable: false,
        title: options.suppressProgress ?
            undefined :
            localize('loadingWorkspaceTitle', 'Loading workspace project starting configurations...')
    }, async () => {
        startingConfiguration = await getStartingConfiguration({ ...context });
    });

    const wizardContext: DeployWorkspaceProjectInternalContext = {
        ...context,
        ...activityContext,
        ...startingConfiguration
    };

    const promptSteps: AzureWizardPromptStep<DeployWorkspaceProjectInternalContext>[] = [
        new DeployWorkspaceProjectConfirmStep(!!options.suppressConfirmation),
        new SharedResourcesNameStep(),
        new AppResourcesNameStep(!!options.suppressContainerAppCreation)
    ];

    const executeSteps: AzureWizardExecuteStep<DeployWorkspaceProjectInternalContext>[] = [
        new DeployWorkspaceProjectSaveSettingsStep()
    ];

    // Resource group
    if (wizardContext.resourceGroup) {
        const resourceGroupName: string = nonNullValueAndProp(wizardContext.resourceGroup, 'name');
        logExistingResourceGroup(wizardContext, resourceGroupName);

        wizardContext.telemetry.properties.existingResourceGroup = 'true';
        await LocationListStep.setLocation(wizardContext, wizardContext.resourceGroup.location);
    } else {
        wizardContext.telemetry.properties.existingResourceGroup = 'false';
        executeSteps.push(new ResourceGroupCreateStep());
    }

    // Managed environment
    if (wizardContext.managedEnvironment) {
        const environmentName: string = nonNullValueAndProp(wizardContext.managedEnvironment, 'name');
        logExistingEnvironment(wizardContext, environmentName);

        wizardContext.telemetry.properties.existingEnvironment = 'true';
        if (!LocationListStep.hasLocation(wizardContext)) {
            await LocationListStep.setLocation(wizardContext, wizardContext.managedEnvironment.location);
        }
    } else {
        wizardContext.telemetry.properties.existingEnvironment = 'false';
        executeSteps.push(
            new LogAnalyticsCreateStep(),
            new ManagedEnvironmentCreateStep()
        );
    }

    // Azure Container Registry
    if (wizardContext.registry) {
        const registryName: string = nonNullValueAndProp(wizardContext.registry, 'name');
        logExistingContainerRegistry(wizardContext, registryName);
        wizardContext.telemetry.properties.existingRegistry = 'true';
    } else {
        // ImageSourceListStep can already handle this creation logic
        wizardContext.telemetry.properties.existingRegistry = 'false';
    }

    // Container app
    if (wizardContext.containerApp) {
        const containerAppName: string = nonNullValueAndProp(wizardContext.containerApp, 'name');
        logExistingContainerApp(wizardContext, containerAppName);

        wizardContext.telemetry.properties.existingContainerApp = 'true';
        if (!LocationListStep.hasLocation(wizardContext)) {
            await LocationListStep.setLocation(wizardContext, wizardContext.containerApp.location);
        }
        executeSteps.push(new ContainerAppUpdateStep());
    } else {
        wizardContext.telemetry.properties.existingContainerApp = 'false';
        if (!options.suppressContainerAppCreation) {
            executeSteps.push(new ContainerAppCreateStep());
        }
    }

    promptSteps.push(
        new ImageSourceListStep(),
        new IngressPromptStep(),
    );

    // Verify providers
    executeSteps.push(getVerifyProvidersStep<DeployWorkspaceProjectInternalContext>());

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

    const wizard: AzureWizard<DeployWorkspaceProjectInternalContext> = new AzureWizard(wizardContext, {
        title: options.suppressWizardTitle ?
            undefined :
            localize('deployWorkspaceProjectTitle', 'Deploy workspace project to a container app'),
        promptSteps,
        executeSteps,
        showLoadingPrompt: true
    });

    await wizard.prompt();

    if (!options.suppressActivity) {
        wizardContext.activityTitle = localize('deployWorkspaceProjectActivityTitle', 'Deploy workspace project to container app "{0}"', wizardContext.containerApp?.name || wizardContext.newContainerAppName);
    }

    ext.outputChannel.appendLog(
        formatSectionHeader(localize('beginCommandExecution', 'Deploy workspace project'))
    );

    await wizard.execute();

    wizardContext.telemetry.properties.revisionMode = wizardContext.containerApp?.revisionsMode;

    ext.outputChannel.appendLog(
        formatSectionHeader(localize('finishCommandExecution', 'Finished deploying workspace project'))
    );

    ext.branchDataProvider.refresh();

    return wizardContext;
}
