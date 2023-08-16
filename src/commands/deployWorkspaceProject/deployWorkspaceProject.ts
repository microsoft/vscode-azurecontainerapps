/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { VerifyProvidersStep } from "@microsoft/vscode-azext-azureutils";
import { AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, IActionContext, ISubscriptionContext, createSubscriptionContext, subscriptionExperience } from "@microsoft/vscode-azext-utils";
import { AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { appProvider, operationalInsightsProvider, webProvider } from "../../constants";
import { ext } from "../../extensionVariables";
import { createActivityContext } from "../../utils/activityUtils";
import { localize } from "../../utils/localize";
import { ContainerAppCreateStep } from "../createContainerApp/ContainerAppCreateStep";
import { ManagedEnvironmentListStep } from "../createManagedEnvironment/ManagedEnvironmentListStep";
import { ImageSourceListStep } from "../deployImage/imageSource/ImageSourceListStep";
import { IngressPromptStep } from "../ingress/IngressPromptStep";
import { IDeployWorkspaceProjectContext } from "./IDeployWorkspaceProjectContext";
import { setDeployWorkspaceDefaultValues } from "./setDeployWorkspaceDefaultValues";

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

    // Managed Environment
    promptSteps.push(new ManagedEnvironmentListStep());

    providers.push(
        appProvider,
        operationalInsightsProvider
    );

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
