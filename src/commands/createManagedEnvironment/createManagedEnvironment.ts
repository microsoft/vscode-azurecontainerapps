/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { LocationListStep, ResourceGroupCreateStep, VerifyProvidersStep } from "@microsoft/vscode-azext-azureutils";
import { AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, IActionContext, createSubscriptionContext, nonNullProp, subscriptionExperience } from "@microsoft/vscode-azext-utils";
import { AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { appProvider, managedEnvironmentsId, operationalInsightsProvider } from "../../constants";
import { ext } from "../../extensionVariables";
import { createActivityContext } from "../../utils/activity/activityUtils";
import { localize } from "../../utils/localize";
import { IManagedEnvironmentContext } from "./IManagedEnvironmentContext";
import { LogAnalyticsCreateStep } from "./LogAnalyticsCreateStep";
import { ManagedEnvironmentCreateStep } from "./ManagedEnvironmentCreateStep";
import { ManagedEnvironmentNameStep } from "./ManagedEnvironmentNameStep";

export async function createManagedEnvironment(context: IActionContext, node?: { subscription: AzureSubscription }): Promise<void> {
    const subscription = node?.subscription ?? await subscriptionExperience(context, ext.rgApiV2.resources.azureResourceTreeDataProvider);

    const wizardContext: IManagedEnvironmentContext = {
        ...context,
        ...createSubscriptionContext(subscription),
        ...(await createActivityContext()),
        subscription
    };

    const title: string = localize('createManagedEnv', 'Create Container Apps environment');
    const promptSteps: AzureWizardPromptStep<IManagedEnvironmentContext>[] = [];
    const executeSteps: AzureWizardExecuteStep<IManagedEnvironmentContext>[] = [];

    promptSteps.push(new ManagedEnvironmentNameStep());
    executeSteps.push(new VerifyProvidersStep([appProvider, operationalInsightsProvider]), new ResourceGroupCreateStep(), new LogAnalyticsCreateStep(), new ManagedEnvironmentCreateStep());
    LocationListStep.addProviderForFiltering(wizardContext, appProvider, managedEnvironmentsId);
    LocationListStep.addStep(wizardContext, promptSteps);

    const wizard: AzureWizard<IManagedEnvironmentContext> = new AzureWizard(wizardContext, {
        title,
        promptSteps,
        executeSteps,
        showLoadingPrompt: true
    });

    await wizard.prompt();
    const newManagedEnvName = nonNullProp(wizardContext, 'newManagedEnvironmentName');
    wizardContext.newResourceGroupName = newManagedEnvName;
    wizardContext.activityTitle = localize('createNamedManagedEnv', 'Create Container Apps environment "{0}"', newManagedEnvName);
    await wizard.execute();

    ext.branchDataProvider.refresh();
}
