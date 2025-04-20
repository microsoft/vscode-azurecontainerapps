/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ManagedEnvironment } from "@azure/arm-appcontainers";
import { LocationListStep, ResourceGroupCreateStep } from "@microsoft/vscode-azext-azureutils";
import { AzureWizard, createSubscriptionContext, nonNullProp, subscriptionExperience, type AzureWizardExecuteStep, type AzureWizardPromptStep, type IActionContext } from "@microsoft/vscode-azext-utils";
import { type AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { appProvider, managedEnvironmentsId } from "../../constants";
import { ext } from "../../extensionVariables";
import { createActivityContext } from "../../utils/activityUtils";
import { getVerifyProvidersStep } from "../../utils/getVerifyProvidersStep";
import { localize } from "../../utils/localize";
import { LogAnalyticsCreateStep } from "./LogAnalyticsCreateStep";
import { type ManagedEnvironmentCreateContext } from "./ManagedEnvironmentCreateContext";
import { ManagedEnvironmentCreateStep } from "./ManagedEnvironmentCreateStep";
import { ManagedEnvironmentNameStep } from "./ManagedEnvironmentNameStep";

export async function createManagedEnvironment(context: IActionContext, node?: { subscription: AzureSubscription }): Promise<ManagedEnvironment> {
    const subscription = node?.subscription ?? await subscriptionExperience(context, ext.rgApiV2.resources.azureResourceTreeDataProvider);

    const wizardContext: ManagedEnvironmentCreateContext = {
        ...context,
        ...createSubscriptionContext(subscription),
        ...await createActivityContext({ withChildren: true }),
        subscription
    };

    const title: string = localize('createManagedEnv', 'Create container apps environment');
    const promptSteps: AzureWizardPromptStep<ManagedEnvironmentCreateContext>[] = [];
    const executeSteps: AzureWizardExecuteStep<ManagedEnvironmentCreateContext>[] = [];

    promptSteps.push(new ManagedEnvironmentNameStep());
    executeSteps.push(
        getVerifyProvidersStep<ManagedEnvironmentCreateContext>(),
        new ResourceGroupCreateStep(),
        new LogAnalyticsCreateStep(),
        new ManagedEnvironmentCreateStep()
    );
    LocationListStep.addProviderForFiltering(wizardContext, appProvider, managedEnvironmentsId);
    LocationListStep.addStep(wizardContext, promptSteps);

    const wizard: AzureWizard<ManagedEnvironmentCreateContext> = new AzureWizard(wizardContext, {
        title,
        promptSteps,
        executeSteps,
        showLoadingPrompt: true
    });

    await wizard.prompt();
    const newManagedEnvName = nonNullProp(wizardContext, 'newManagedEnvironmentName');
    wizardContext.newResourceGroupName = newManagedEnvName;
    wizardContext.activityTitle = localize('createNamedManagedEnv', 'Create container apps environment "{0}"', newManagedEnvName);
    await wizard.execute();

    ext.branchDataProvider.refresh();
    return nonNullProp(wizardContext, 'managedEnvironment');
}
