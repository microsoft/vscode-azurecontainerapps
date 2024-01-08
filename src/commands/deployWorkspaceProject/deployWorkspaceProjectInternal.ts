/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { LocationListStep, ResourceGroupCreateStep } from "@microsoft/vscode-azext-azureutils";
import { AzureWizard, GenericTreeItem, activityInfoIcon, activitySuccessContext, nonNullValueAndProp, type AzureWizardExecuteStep, type AzureWizardPromptStep, type ExecuteActivityContext } from "@microsoft/vscode-azext-utils";
import { ProgressLocation, window } from "vscode";
import { appProvider, managedEnvironmentsId } from "../../constants";
import { ext } from "../../extensionVariables";
import { type ContainerAppItem } from "../../tree/ContainerAppItem";
import { type ManagedEnvironmentItem } from "../../tree/ManagedEnvironmentItem";
import { createActivityChildContext, createActivityContext } from "../../utils/activity/activityUtils";
import { getVerifyProvidersStep } from "../../utils/getVerifyProvidersStep";
import { localize } from "../../utils/localize";
import { type IContainerAppContext } from "../IContainerAppContext";
import { ContainerAppCreateStep } from "../createContainerApp/ContainerAppCreateStep";
import { LogAnalyticsCreateStep } from "../createManagedEnvironment/LogAnalyticsCreateStep";
import { ManagedEnvironmentCreateStep } from "../createManagedEnvironment/ManagedEnvironmentCreateStep";
import { ContainerAppUpdateStep } from "../image/imageSource/ContainerAppUpdateStep";
import { ImageSourceListStep } from "../image/imageSource/ImageSourceListStep";
import { IngressPromptStep } from "../ingress/IngressPromptStep";
import { DeployWorkspaceProjectConfirmStep } from "./DeployWorkspaceProjectConfirmStep";
import { type DeployWorkspaceProjectContext } from "./DeployWorkspaceProjectContext";
import { DeployWorkspaceProjectSaveSettingsStep } from "./DeployWorkspaceProjectSaveSettingsStep";
import { ShouldSaveDeploySettingsPromptStep } from "./ShouldSaveDeploySettingsPromptStep";
import { DefaultResourcesNameStep } from "./getDefaultValues/DefaultResourcesNameStep";
import { getDefaultContextValues } from "./getDefaultValues/getDefaultContextValues";

export type DeployWorkspaceProjectInternalContext = IContainerAppContext & Partial<DeployWorkspaceProjectContext>;

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
    item: ContainerAppItem | ManagedEnvironmentItem | undefined,
    options: DeployWorkspaceProjectInternalOptions
): Promise<DeployWorkspaceProjectContext> {

    ext.outputChannel.appendLog(
        wrapWithDashFormatting(localize('initCommandExecution', 'Initializing deploy workspace project'))
    );

    let activityContext: Partial<ExecuteActivityContext>;
    if (options.suppressActivity) {
        activityContext = { suppressNotification: true };
    } else {
        activityContext = await createActivityContext();
        activityContext.activityChildren = [];
    }

    // Show loading indicator while we configure default values
    let defaultContextValues: Partial<DeployWorkspaceProjectContext> | undefined;
    await window.withProgress({
        location: ProgressLocation.Notification,
        cancellable: false,
        title: options.suppressProgress ?
            undefined :
            localize('loadingWorkspaceTitle', 'Loading workspace project deployment configurations...')
    }, async () => {
        defaultContextValues = await getDefaultContextValues(context, item);
    });

    const wizardContext: DeployWorkspaceProjectContext = {
        ...context,
        ...activityContext,
        ...defaultContextValues,
    };

    const promptSteps: AzureWizardPromptStep<DeployWorkspaceProjectContext>[] = [
        new DeployWorkspaceProjectConfirmStep(!!options.suppressConfirmation),
        new DefaultResourcesNameStep()
    ];

    const executeSteps: AzureWizardExecuteStep<DeployWorkspaceProjectContext>[] = [
        new DeployWorkspaceProjectSaveSettingsStep()
    ];

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
        // ImageSourceListStep can already handle this creation logic
        wizardContext.telemetry.properties.existingRegistry = 'false';
    }

    // Container app
    if (wizardContext.containerApp) {
        wizardContext.telemetry.properties.existingContainerApp = 'true';

        const containerAppName: string = nonNullValueAndProp(wizardContext.containerApp, 'name');

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

        if (!options.suppressContainerAppCreation) {
            executeSteps.push(new ContainerAppCreateStep());
        }
    }

    promptSteps.push(
        new ImageSourceListStep(),
        new IngressPromptStep(),
    );

    // Verify providers
    executeSteps.push(getVerifyProvidersStep<DeployWorkspaceProjectContext>());

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
        wrapWithDashFormatting(localize('beginCommandExecution', 'Deploying workspace project'))
    );

    await wizard.execute();

    wizardContext.telemetry.properties.revisionMode = wizardContext.containerApp?.revisionsMode;

    ext.outputChannel.appendLog(
        wrapWithDashFormatting(localize('finishCommandExecution', 'Finished deploying workspace project'))
    );

    ext.branchDataProvider.refresh();

    return wizardContext;
}

/**
 * Wrap a string with dashes to make key text more easily visible
 * @example "--------hello-world--------"
 */
function wrapWithDashFormatting(text: string): string {
    return `--------${text}--------`;
}
