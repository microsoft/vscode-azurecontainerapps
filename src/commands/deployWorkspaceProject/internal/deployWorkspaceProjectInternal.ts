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
import { ContainerAppListStep } from "../../createContainerApp/ContainerAppListStep";
import { LogAnalyticsCreateStep } from "../../createManagedEnvironment/LogAnalyticsCreateStep";
import { ManagedEnvironmentCreateStep } from "../../createManagedEnvironment/ManagedEnvironmentCreateStep";
import { ManagedEnvironmentListStep } from "../../createManagedEnvironment/ManagedEnvironmentListStep";
import { editContainerCommandName } from "../../editContainer/editContainer";
import { RootFolderStep } from "../../image/imageSource/buildImageInAzure/RootFolderStep";
import { ContainerAppUpdateStep } from "../../image/imageSource/ContainerAppUpdateStep";
import { AcrListStep } from "../../image/imageSource/containerRegistry/acr/AcrListStep";
import { RegistryCreateStep } from "../../image/imageSource/containerRegistry/acr/createAcr/RegistryCreateStep";
import { ImageSourceListStep } from "../../image/imageSource/ImageSourceListStep";
import { IngressPromptStep } from "../../ingress/IngressPromptStep";
import { StartingResourcesLogStep } from "../../StartingResourcesLogStep";
import { deployWorkspaceProjectCommandName } from "../deployWorkspaceProject";
import { formatSectionHeader } from "../formatSectionHeader";
import { AppResourcesNameStep } from "./AppResourcesNameStep";
import { DeployWorkspaceProjectConfirmStep } from "./DeployWorkspaceProjectConfirmStep";
import { type DeployWorkspaceProjectInternalContext } from "./DeployWorkspaceProjectInternalContext";
import { DeployWorkspaceProjectSaveSettingsStep } from "./DeployWorkspaceProjectSaveSettingsStep";
import { getStartingConfiguration } from "./getStartingConfiguration";
import { ManagedEnvironmentRecommendWorkspacePicksStrategy } from "./ManagedEnvironmentRecommendWorkspacePicksStrategy";
import { SharedResourcesNameStep } from "./SharedResourcesNameStep";
import { ShouldSaveDeploySettingsPromptStep } from "./ShouldSaveDeploySettingsPromptStep";

export interface DeployWorkspaceProjectInternalOptions {
    /**
     * Set to offer advanced creation prompts
     */
    advancedCreate?: boolean;
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
        activityContext = await createActivityContext(true);
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
        startingConfiguration = await getStartingConfiguration(context, options);
    });

    if (context.containerApp?.revisionsMode === KnownActiveRevisionsMode.Multiple) {
        throw new Error(localize('multipleRevisionsNotSupported', 'The container app cannot be updated using "{0}" while in multiple revisions mode. Navigate to the revision\'s container and execute "{1}" instead.', deployWorkspaceProjectCommandName, editContainerCommandName));
    }
    if ((context.containerApp?.template?.containers?.length ?? 0) > 1) {
        throw new Error(localize('multipleContainersNotSupported', 'The container app cannot be updated using "{0}" while having more than one active container. Navigate to the specific container instance and execute "{1}" instead.', deployWorkspaceProjectCommandName, editContainerCommandName));
    }

    const wizardContext: DeployWorkspaceProjectInternalContext = {
        ...context,
        ...activityContext,
        ...startingConfiguration,
    };

    const promptSteps: AzureWizardPromptStep<DeployWorkspaceProjectInternalContext>[] = [
        new RootFolderStep(),
        // new DockerfileItemStep(),
    ];
    const executeSteps: AzureWizardExecuteStep<DeployWorkspaceProjectInternalContext>[] = [];

    if (!options.advancedCreate) {
        // Basic
        if (!wizardContext.resourceGroup) {
            executeSteps.push(new ResourceGroupCreateStep());
        }
        if (!wizardContext.managedEnvironment) {
            promptSteps.push(new ManagedEnvironmentListStep({
                skipIfNone: true,
                skipSubWizardCreate: true,
                pickUpdateStrategy: new ManagedEnvironmentRecommendWorkspacePicksStrategy(),
            }));
            executeSteps.push(
                new LogAnalyticsCreateStep(),
                new ManagedEnvironmentCreateStep(),
            );
        }
        if (!wizardContext.registry && !options.suppressRegistryPrompt) {
            promptSteps.push(new AcrListStep({ skipSubWizardCreate: true }));
            executeSteps.push(new RegistryCreateStep());
        }
        if (!wizardContext.containerApp && !options.suppressContainerAppCreation) {
            executeSteps.push(new ContainerAppCreateStep());
        }
        promptSteps.push(
            new SharedResourcesNameStep(),
            new AppResourcesNameStep(!!options.suppressContainerAppCreation),
            new ImageSourceListStep(),
            new IngressPromptStep(),
        );
    } else {
        // Advanced
        if (!wizardContext.resourceGroup) {
            promptSteps.push(new ResourceGroupListStep());
        }
        if (!wizardContext.managedEnvironment) {
            // Todo: try out different pick filter strategies based on existing resource group vs. existing config
            promptSteps.push(new ManagedEnvironmentListStep({
                skipIfNone: true,
                pickUpdateStrategy: new ManagedEnvironmentRecommendWorkspacePicksStrategy(),
            }));
        }
        if (!wizardContext.registry) {
            promptSteps.push(new AcrListStep());
        }
        if (!wizardContext.containerApp && !options.suppressContainerAppCreation) {
            promptSteps.push(new ContainerAppListStep({ skipIfNone: true, updateIfExists: true }));
        }
    }

    if (wizardContext.containerApp) {
        executeSteps.push(new ContainerAppUpdateStep());
    }

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

    promptSteps.push(
        new DeployWorkspaceProjectConfirmStep(!!options.suppressConfirmation),
        new StartingResourcesLogStep(),
    );

    // Save deploy settings
    promptSteps.push(new ShouldSaveDeploySettingsPromptStep());
    executeSteps.push(new DeployWorkspaceProjectSaveSettingsStep());

    const wizard: AzureWizard<DeployWorkspaceProjectInternalContext> = new AzureWizard(wizardContext, {
        title: options.suppressWizardTitle ?
            undefined :
            localize('deployWorkspaceProjectTitle', 'Deploy workspace project to a container app'),
        promptSteps,
        executeSteps,
        showLoadingPrompt: true,
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
