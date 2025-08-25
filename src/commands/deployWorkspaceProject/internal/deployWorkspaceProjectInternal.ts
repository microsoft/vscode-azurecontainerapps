/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode } from "@azure/arm-appcontainers";
import { LocationListStep, ResourceGroupCreateStep, ResourceGroupListStep } from "@microsoft/vscode-azext-azureutils";
import { AzureWizard, type AzureWizardExecuteStep, type AzureWizardPromptStep, type ExecuteActivityContext } from "@microsoft/vscode-azext-utils";
import { ProgressLocation, window } from "vscode";
import { containerAppProvider, containerAppResourceType, logAnalyticsProvider, logAnalyticsResourceType, managedEnvironmentProvider, managedEnvironmentResourceType, registryProvider, registryResourceType } from "../../../constants";
import { ext } from "../../../extensionVariables";
import { createActivityContext } from "../../../utils/activityUtils";
import { getVerifyProvidersStep } from "../../../utils/getVerifyProvidersStep";
import { localize } from "../../../utils/localize";
import { CommandAttributes } from "../../CommandAttributes";
import { ContainerAppCreateStep } from "../../createContainerApp/ContainerAppCreateStep";
import { ContainerAppListStep } from "../../createContainerApp/ContainerAppListStep";
import { LogAnalyticsCreateStep } from "../../createManagedEnvironment/LogAnalyticsCreateStep";
import { ManagedEnvironmentCreateStep } from "../../createManagedEnvironment/ManagedEnvironmentCreateStep";
import { ManagedEnvironmentListStep } from "../../createManagedEnvironment/ManagedEnvironmentListStep";
import { editContainerCommandName } from "../../editContainer/editContainer";
import { RootFolderStep } from "../../image/imageSource/buildImageInAzure/RootFolderStep";
import { ContainerAppUpdateStep } from "../../image/imageSource/ContainerAppUpdateStep";
import { AcrDefaultSortAndPrioritizationStrategy } from "../../image/imageSource/containerRegistry/acr/AcrDefaultSortAndPrioritizationStrategy";
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
import { getStartingConfiguration } from "./getStartingConfiguration/getStartingConfiguration";
import { ManagedEnvironmentLocalSettingsSortStrategy } from "./ManagedEnvironmentLocalSettingsSortStrategy";
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
        activityContext = await createActivityContext({ withChildren: true });
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

    if (startingConfiguration?.containerApp?.revisionsMode === KnownActiveRevisionsMode.Multiple) {
        throw new Error(localize('multipleRevisionsNotSupported', 'The container app cannot be updated using "{0}" while in multiple revisions mode. Navigate to the revision\'s container and execute "{1}" instead.', deployWorkspaceProjectCommandName, editContainerCommandName));
    }
    if ((startingConfiguration?.containerApp?.template?.containers?.length ?? 0) > 1) {
        throw new Error(localize('multipleContainersNotSupported', 'The container app cannot be updated using "{0}" while having more than one active container. Navigate to the specific container instance and execute "{1}" instead.', deployWorkspaceProjectCommandName, editContainerCommandName));
    }

    const wizardContext: DeployWorkspaceProjectInternalContext = {
        ...context,
        ...activityContext,
        ...startingConfiguration,
        activityAttributes: CommandAttributes.DeployWorkspaceProjectInternal,
    };

    const promptSteps: AzureWizardPromptStep<DeployWorkspaceProjectInternalContext>[] = [
        new RootFolderStep(),
    ];
    const executeSteps: AzureWizardExecuteStep<DeployWorkspaceProjectInternalContext>[] = [];

    LocationListStep.addProviderForFiltering(context, managedEnvironmentProvider, managedEnvironmentResourceType);
    LocationListStep.addProviderForFiltering(context, logAnalyticsProvider, logAnalyticsResourceType);
    LocationListStep.addProviderForFiltering(context, registryProvider, registryResourceType);
    LocationListStep.addProviderForFiltering(context, containerAppProvider, containerAppResourceType);
    LocationListStep.addStep(wizardContext, promptSteps);

    if (!options.advancedCreate) {
        // Basic
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
            executeSteps.push(new RegistryCreateStep());
        }
        if (!wizardContext.containerApp && !options.suppressContainerAppCreation) {
            executeSteps.push(new ContainerAppCreateStep());
        }

        promptSteps.push(
            new SharedResourcesNameStep(),
            new AppResourcesNameStep(!!options.suppressContainerAppCreation),
        );
    } else {
        // Advanced
        if (!wizardContext.managedEnvironment) {
            promptSteps.push(new ManagedEnvironmentListStep({
                pickUpdateStrategy: new ManagedEnvironmentLocalSettingsSortStrategy(),
            }));
        }
        if (!wizardContext.resourceGroup) {
            promptSteps.push(new ResourceGroupListStep());
        }
        if (!wizardContext.registry) {
            promptSteps.push(new AcrListStep({
                pickUpdateStrategy: new AcrDefaultSortAndPrioritizationStrategy(),
            }));
        }
        if (!wizardContext.containerApp && !options.suppressContainerAppCreation) {
            promptSteps.push(new ContainerAppListStep({ updateIfExists: true }));
        }
    }

    if (wizardContext.containerApp) {
        executeSteps.push(new ContainerAppUpdateStep());
    }

    promptSteps.push(
        new ImageSourceListStep(),
        new IngressPromptStep(),
        new DeployWorkspaceProjectConfirmStep(!!options.suppressConfirmation),
        new StartingResourcesLogStep(),
        new ShouldSaveDeploySettingsPromptStep(),
    );

    executeSteps.push(
        getVerifyProvidersStep<DeployWorkspaceProjectInternalContext>(),
        new DeployWorkspaceProjectSaveSettingsStep()
    );

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

    wizardContext.activityAttributes ??= {};
    wizardContext.activityAttributes.azureResource = wizardContext.containerApp;

    return wizardContext;
}
