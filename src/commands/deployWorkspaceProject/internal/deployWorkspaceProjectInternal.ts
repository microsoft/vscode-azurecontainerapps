/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode } from "@azure/arm-appcontainers";
import { LocationListStep, ResourceGroupCreateStep } from "@microsoft/vscode-azext-azureutils";
import { ActivityChildItem, ActivityChildType, AzureWizard, activityInfoContext, activityInfoIcon, nonNullValueAndProp, type AzureWizardExecuteStep, type AzureWizardPromptStep, type ExecuteActivityContext } from "@microsoft/vscode-azext-utils";
import { ProgressLocation, window } from "vscode";
import { appProvider, managedEnvironmentsId } from "../../../constants";
import { ext } from "../../../extensionVariables";
import { createActivityContext, prependOrInsertAfterLastInfoChild } from "../../../utils/activityUtils";
import { getVerifyProvidersStep } from "../../../utils/getVerifyProvidersStep";
import { localize } from "../../../utils/localize";
import { CommandAttributes } from "../../CommandAttributes";
import { ContainerAppCreateStep } from "../../createContainerApp/ContainerAppCreateStep";
import { LogAnalyticsCreateStep } from "../../createManagedEnvironment/LogAnalyticsCreateStep";
import { ManagedEnvironmentCreateStep } from "../../createManagedEnvironment/ManagedEnvironmentCreateStep";
import { editContainerCommandName } from "../../editContainer/editContainer";
import { ContainerAppUpdateStep } from "../../image/imageSource/ContainerAppUpdateStep";
import { ImageSourceListStep } from "../../image/imageSource/ImageSourceListStep";
import { IngressPromptStep } from "../../ingress/IngressPromptStep";
import { deployWorkspaceProjectCommandName } from "../deployWorkspaceProject";
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
        ...startingConfiguration,
        activityAttributes: CommandAttributes.DeployWorkspaceProjectInternal,
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
        wizardContext.telemetry.properties.existingResourceGroup = 'true';

        const resourceGroupName: string = nonNullValueAndProp(wizardContext.resourceGroup, 'name');

        prependOrInsertAfterLastInfoChild(wizardContext,
            new ActivityChildItem({
                label: localize('useResourceGroup', 'Use resource group "{0}"', resourceGroupName),
                activityType: ActivityChildType.Info,
                contextValue: activityInfoContext,
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

        prependOrInsertAfterLastInfoChild(wizardContext,
            new ActivityChildItem({
                label: localize('useManagedEnvironment', 'Use container apps environment "{0}"', managedEnvironmentName),
                activityType: ActivityChildType.Info,
                contextValue: activityInfoContext,
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
    }

    // Azure Container Registry
    if (wizardContext.registry) {
        wizardContext.telemetry.properties.existingRegistry = 'true';

        const registryName: string = nonNullValueAndProp(wizardContext.registry, 'name');

        prependOrInsertAfterLastInfoChild(wizardContext,
            new ActivityChildItem({
                label: localize('useAcr', 'Use container registry "{0}"', registryName),
                activityType: ActivityChildType.Info,
                contextValue: activityInfoContext,
                iconPath: activityInfoIcon
            })
        );

        ext.outputChannel.appendLog(localize('usingAcr', 'Using Azure Container Registry "{0}".', registryName));
    } else {
        // ImageSourceListStep can already handle this creation logic
        wizardContext.telemetry.properties.existingRegistry = 'false';
    }

    // Container app
    if (wizardContext.containerApp) {
        wizardContext.telemetry.properties.existingContainerApp = 'true';

        const containerAppName: string = nonNullValueAndProp(wizardContext.containerApp, 'name');

        executeSteps.push(new ContainerAppUpdateStep());

        prependOrInsertAfterLastInfoChild(wizardContext,
            new ActivityChildItem({
                label: localize('useContainerApp', 'Use container app "{0}"', containerAppName),
                activityType: ActivityChildType.Info,
                contextValue: activityInfoContext,
                iconPath: activityInfoIcon
            })
        );

        ext.outputChannel.appendLog(localize('usingContainerApp', 'Using container app "{0}".', containerAppName));

        if (!LocationListStep.hasLocation(wizardContext)) {
            await LocationListStep.setLocation(wizardContext, wizardContext.containerApp.location);
        }
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

    wizardContext.activityAttributes ??= {};
    wizardContext.activityAttributes.azureResource = wizardContext.containerApp;

    return wizardContext;
}
