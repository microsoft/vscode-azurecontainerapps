/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { LocationListStep, ResourceGroupCreateStep, VerifyProvidersStep } from "@microsoft/vscode-azext-azureutils";
import { AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, ExecuteActivityContext, GenericTreeItem, IActionContext, ISubscriptionContext, createContextValue, createSubscriptionContext, nonNullValueAndProp, subscriptionExperience } from "@microsoft/vscode-azext-utils";
import { AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { ThemeColor, ThemeIcon } from "vscode";
import { activitySuccessContext, appProvider, managedEnvironmentsId, operationalInsightsProvider, webProvider } from "../../constants";
import { ext } from "../../extensionVariables";
import { createActivityContext } from "../../utils/activityUtils";
import { localize } from "../../utils/localize";
import { ContainerAppCreateStep } from "../createContainerApp/ContainerAppCreateStep";
import { ICreateContainerAppContext } from "../createContainerApp/ICreateContainerAppContext";
import { IManagedEnvironmentContext } from "../createManagedEnvironment/IManagedEnvironmentContext";
import { LogAnalyticsCreateStep } from "../createManagedEnvironment/LogAnalyticsCreateStep";
import { ManagedEnvironmentCreateStep } from "../createManagedEnvironment/ManagedEnvironmentCreateStep";
import { ImageSourceListStep } from "../deployImage/imageSource/ImageSourceListStep";
import { IBuildImageInAzureContext } from "../deployImage/imageSource/buildImageInAzure/IBuildImageInAzureContext";
import { IngressPromptStep } from "../ingress/IngressPromptStep";
import { setDeployWorkspaceDefaultValues } from "./setDeployWorkspaceDefaultValues";

export type IDeployWorkspaceProjectContext = IManagedEnvironmentContext & ICreateContainerAppContext & Partial<IBuildImageInAzureContext> & ExecuteActivityContext;

export async function deployWorkspaceProject(context: IActionContext): Promise<void> {
    const subscription: AzureSubscription = await subscriptionExperience(context, ext.rgApiV2.resources.azureResourceTreeDataProvider);
    const subscriptionContext: ISubscriptionContext = createSubscriptionContext(subscription);

    const wizardContext: IDeployWorkspaceProjectContext = {
        ...context,
        ...subscriptionContext,
        ...await createActivityContext(),
        ...await setDeployWorkspaceDefaultValues({ ...context, ...subscriptionContext }),
        activityChildren: [],
        subscription,
    };

    const promptSteps: AzureWizardPromptStep<IDeployWorkspaceProjectContext>[] = [];
    const executeSteps: AzureWizardExecuteStep<IDeployWorkspaceProjectContext>[] = [];

    const providers: string[] = [];

    // Resource Group
    if (wizardContext.resourceGroup) {
        const resourceGroupName: string = nonNullValueAndProp(wizardContext.resourceGroup, 'name');

        wizardContext.activityChildren?.push(
            new GenericTreeItem(undefined, {
                contextValue: createContextValue(['useResourceGroupActivity', resourceGroupName, activitySuccessContext]),
                label: localize('usedResourceGroup', 'Use resource group "{0}"', resourceGroupName),
                iconPath: new ThemeIcon('pass', new ThemeColor('testing.iconPassed'))
            })
        );
    } else {
        executeSteps.push(new ResourceGroupCreateStep());
    }

    // Managed Environment
    if (wizardContext.managedEnvironment) {
        const managedEnvironmentName: string = nonNullValueAndProp(wizardContext.managedEnvironment, 'name');

        wizardContext.activityChildren?.push(
            new GenericTreeItem(undefined, {
                contextValue: createContextValue(['useManagedEnvironmentActivity', managedEnvironmentName, activitySuccessContext]),
                label: localize('usedManagedEnvironment', 'Use container app environment "{0}"', managedEnvironmentName),
                iconPath: new ThemeIcon('pass', new ThemeColor('testing.iconPassed'))
            })
        );
    } else {
        executeSteps.push(
            new LogAnalyticsCreateStep(),
            new ManagedEnvironmentCreateStep()
        );

        providers.push(
            appProvider,
            operationalInsightsProvider
        );
    }

    LocationListStep.addProviderForFiltering(wizardContext, appProvider, managedEnvironmentsId);
    LocationListStep.addStep(wizardContext, promptSteps);

    // Container App
    promptSteps.push(
        new ImageSourceListStep(),
        new IngressPromptStep(),
    );

    executeSteps.push(new ContainerAppCreateStep());
    providers.push(webProvider);

    // Azure Container Registry
    // Do we need to add a location provider for filtering for ACR?

    // Verify Providers
    executeSteps.push(new VerifyProvidersStep(providers));

    const wizard: AzureWizard<IDeployWorkspaceProjectContext> = new AzureWizard(wizardContext, {
        title: localize('deployWorkspaceProjectTitle', 'Deploy workspace project to a container app'),
        promptSteps,
        executeSteps,
        showLoadingPrompt: true
    });

    await wizard.prompt();
    await wizard.execute();

    ext.branchDataProvider.refresh();
}
