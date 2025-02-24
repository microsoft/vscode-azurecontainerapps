/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode } from "@azure/arm-appcontainers";
import { LocationListStep, ResourceGroupCreateStep, ResourceGroupListStep } from "@microsoft/vscode-azext-azureutils";
import { AzureWizard, type AzureWizardExecuteStep, type AzureWizardPromptStep, type ExecuteActivityContext } from "@microsoft/vscode-azext-utils";
import { ProgressLocation, window } from "vscode";
import { appProvider, managedEnvironmentsId } from "../../../constants";
import { ext } from "../../../extensionVariables";
import { createActivityContext } from "../../../utils/activityUtils";
import { getVerifyProvidersStep } from "../../../utils/getVerifyProvidersStep";
import { localize } from "../../../utils/localize";
import { ContainerAppCreateStep } from "../../createContainerApp/ContainerAppCreateStep";
import { LogAnalyticsCreateStep } from "../../createManagedEnvironment/LogAnalyticsCreateStep";
import { ManagedEnvironmentCreateStep } from "../../createManagedEnvironment/ManagedEnvironmentCreateStep";
import { ManagedEnvironmentListStep } from "../../createManagedEnvironment/ManagedEnvironmentListStep";
import { editContainerCommandName } from "../../editContainer/editContainer";
import { ContainerAppUpdateStep } from "../../image/imageSource/ContainerAppUpdateStep";
import { ImageSourceListStep } from "../../image/imageSource/ImageSourceListStep";
import { IngressPromptStep } from "../../ingress/IngressPromptStep";
import { deployWorkspaceProjectCommandName } from "../deployWorkspaceProject";
import { formatSectionHeader } from "../formatSectionHeader";
import { AppResourcesNameStep } from "./AppResourcesNameStep";
import { type DeployWorkspaceProjectInternalContext } from "./DeployWorkspaceProjectInternalContext";
import { DeployWorkspaceProjectSaveSettingsStep } from "./DeployWorkspaceProjectSaveSettingsStep";
import { SharedResourcesNameStep } from "./SharedResourcesNameStep";
import { ShouldSaveDeploySettingsPromptStep } from "./ShouldSaveDeploySettingsPromptStep";
import { DwpManagedEnvironmentRecommendedPicksStrategy } from "./startingConfiguration/DwpManagedEnvironmentRecommendedPicksStrategy";
import { getStartingConfiguration } from "./startingConfiguration/getStartingConfiguration";

export interface DeployWorkspaceProjectInternalOptions {
    advancedCreate: boolean;
    /**
     * Suppress showing the wizard execution through the activity log
     */
    suppressActivity?: boolean;
    /**
     * Suppress registry selection prompt
     */
    suppressRegistryPrompt?: boolean;
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
        startingConfiguration = await getStartingConfiguration({ ...context }, options);
    });

    if (startingConfiguration?.containerApp?.revisionsMode === KnownActiveRevisionsMode.Multiple) {
        throw new Error(localize('multipleRevisionsNotSupported', 'The container app cannot be updated using "{0}" while in multiple revisions mode. Navigate to the revision\'s container and execute "{1}" instead.', deployWorkspaceProjectCommandName, editContainerCommandName));
    }
    if ((startingConfiguration?.containerApp?.template?.containers?.length ?? 0) > 1) {
        throw new Error(localize('multipleContainersNotSupported', 'The container app cannot be updated using "{0}" while having more than one active container. Navigate to the specific container instance and execute "{1}" instead.', deployWorkspaceProjectCommandName, editContainerCommandName));
    }

    const wizardContext: DeployWorkspaceProjectInternalContext = {
        ...context,
        ...activityContext,
        ...startingConfiguration
    };

    const promptSteps: AzureWizardPromptStep<DeployWorkspaceProjectInternalContext>[] = [
        // new DwpStartingResourcesLogStep(),
        // new DeployWorkspaceProjectConfirmStep(!!options.suppressConfirmation),
    ];

    const executeSteps: AzureWizardExecuteStep<DeployWorkspaceProjectInternalContext>[] = [];

    if (!options.advancedCreate) {
        // Basic
        promptSteps.push(new SharedResourcesNameStep());
        promptSteps.push(new AppResourcesNameStep(!!options.suppressContainerAppCreation));
        if (!wizardContext.resourceGroup) {
            executeSteps.push(new ResourceGroupCreateStep());
        }
        if (!wizardContext.managedEnvironment) {
            executeSteps.push(
                new LogAnalyticsCreateStep(),
                new ManagedEnvironmentCreateStep(),
            );
        }
        if (!wizardContext.registry) {
            // Add acrListStep, maybe add new way of handling registry recommendation strategy
        }
        if (!wizardContext.containerApp && !options.suppressContainerAppCreation) {
            executeSteps.push(new ContainerAppCreateStep());
        }
    } else {
        // Advanced
        if (!wizardContext.resourceGroup) {
            promptSteps.push(new ResourceGroupListStep());
        }
        if (!wizardContext.managedEnvironment) {
            promptSteps.push(new ManagedEnvironmentListStep({
                recommendedPicksStrategy: new DwpManagedEnvironmentRecommendedPicksStrategy(),
            }));
        }
        if (!wizardContext.registry) {
            // Add acrListStep, maybe add new way of handling registry recommendation strategy
            // Sku step select step?
        }
        if (!wizardContext.containerApp && !options.suppressContainerAppCreation) {
            // Container app list step
        }
    }

    if (wizardContext.containerApp) {
        executeSteps.push(new ContainerAppUpdateStep());
        if (!LocationListStep.hasLocation(wizardContext)) {
            await LocationListStep.setLocation(wizardContext, wizardContext.containerApp.location);
        }
    }

    promptSteps.push(
        new ImageSourceListStep(),
        new IngressPromptStep(),
    );
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
    executeSteps.push(new DeployWorkspaceProjectSaveSettingsStep());

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
