/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { LocationListStep, ResourceGroupCreateStep } from "@microsoft/vscode-azext-azureutils";
import { AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, IActionContext, createSubscriptionContext, subscriptionExperience } from "@microsoft/vscode-azext-utils";
import { ImageSource } from "../../constants";
import { ext } from "../../extensionVariables";
import { createActivityContext } from "../../utils/activityUtils";
import { ICreateContainerAppContext } from "../createContainerApp/ICreateContainerAppContext";
import { IManagedEnvironmentContext } from "../createManagedEnvironment/IManagedEnvironmentContext";
import { LogAnalyticsCreateStep } from "../createManagedEnvironment/LogAnalyticsCreateStep";
import { ManagedEnvironmentCreateStep } from "../createManagedEnvironment/ManagedEnvironmentCreateStep";
import { ImageSourceListStep } from "../deployImage/imageSource/ImageSourceListStep";
import { IBuildImageInAzureContext } from "../deployImage/imageSource/buildImageInAzure/IBuildImageInAzureContext";

type IDeployWorkspaceProjectContext = IManagedEnvironmentContext & ICreateContainerAppContext & IBuildImageInAzureContext;

export async function deployWorkspaceProject(context: IActionContext): Promise<void> {
    const subscription = await subscriptionExperience(context, ext.rgApiV2.resources.azureResourceTreeDataProvider);

    // Other questions: (1) Do we want to save container app as project properties for future deploy from workspace?
    // (2) Do we want to distinguish basic vs advanced scenario?  What should the difference be?

    const wizardContext: IDeployWorkspaceProjectContext = {
        ...context,
        ...createSubscriptionContext(subscription),
        ...await createActivityContext(),
        subscription,
        // could add a function that you call that returns defaulted values for the wizardContext
        newResourceGroupName: 'mwf1-rg',
        // make this naming behavior consistent across the steps...
        newManagedEnvironmentName: 'mwf1-env',
        newContainerAppName: 'mwf1-ca',
        imageSource: ImageSource.RemoteAcrBuild,
        // imageName
        // rootFolder
        // dockerfilePath
        // os???? (verify if this can be autodetected off the dockerfile)
        // enableIngress: true
        // enableExternal: true
        // targetPort
        // location or prompt??
    };

    const promptSteps: AzureWizardPromptStep<IDeployWorkspaceProjectContext>[] = [];
    const executeSteps: AzureWizardExecuteStep<IDeployWorkspaceProjectContext>[] = [];

    // Managed Environment
    // Most of these steps can probably be encapsulated into the list step...
    promptSteps.push(/** ManagedEnvironmentListStep... */);
    executeSteps.push(
        // new VerifyProvidersStep(['Microsoft.App', 'Microsoft.OperationalInsights']),
        new ResourceGroupCreateStep(),
        new LogAnalyticsCreateStep(),
        new ManagedEnvironmentCreateStep()
    );

    LocationListStep.addProviderForFiltering(wizardContext, 'Microsoft.App', 'managedEnvironments');
    LocationListStep.addStep(wizardContext, promptSteps);

    // Container App
    // Most of these steps can probably be encapsulated into the list step..

    // Maybe check if a container app exists, if it does, select it and add in deploy steps
    // Else, if creating a new container app, the deploy will be captured in that list step logic...

    promptSteps.push(
        new ContainerAppNameStep(),
        new ImageSourceListStep(),
        new IngressPromptStep(),
    );

    executeSteps.push(
        // new VerifyProvidersStep([webProvider]),
        new ContainerAppCreateStep(),
    );

    // Verify how we need to handle running `addProviderForFiltering` and `VerifyProvidersStep` across all scenarios...
    // Add way to create registry in AcrListStep

    const wizard: AzureWizard<IDeployWorkspaceProjectContext> = new AzureWizard(wizardContext, {
        title: 'placeholder',
        promptSteps,
        executeSteps,
        showLoadingPrompt: true
    });

    await wizard.prompt();
    await wizard.execute();

    ext.branchDataProvider.refresh();
}
