/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { LocationListStep, ResourceGroupCreateStep, SubscriptionTreeItemBase, VerifyProvidersStep } from "@microsoft/vscode-azext-azureutils";
import { AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, IActionContext, nonNullProp } from "@microsoft/vscode-azext-utils";
import { AppResource } from "@microsoft/vscode-azext-utils/hostapi";
import { ext } from "../../../extensionVariables";
import { ContainerAppsExtResolver } from "../../../resolver/ContainerAppsExtResolver";
import { ManagedEnvironmentResource } from "../../../resolver/ManagedEnvironmentResource";
import { createActivityContext } from "../../../utils/activityUtils";
import { localize } from "../../../utils/localize";
import { IManagedEnvironmentContext } from "./IManagedEnvironmentContext";
import { LogAnalyticsCreateStep } from "./LogAnalyticsCreateStep";
import { ManagedEnvironmentCreateStep } from "./ManagedEnvironmentCreateStep";
import { ManagedEnvironmentNameStep } from "./ManagedEnvironmentNameStep";

export async function createManagedEnvironment(context: IActionContext, node?: SubscriptionTreeItemBase): Promise<ManagedEnvironmentResource> {
    if (!node) {
        node = await ext.rgApi.appResourceTree.showTreeItemPicker<SubscriptionTreeItemBase>(SubscriptionTreeItemBase.contextValue, context);
    }

    const wizardContext: IManagedEnvironmentContext = {
        ...context,
        ...node.subscription,
        ...(await createActivityContext())
    };

    const title: string = localize('createManagedEnv', 'Create new Container Apps environment');
    const promptSteps: AzureWizardPromptStep<IManagedEnvironmentContext>[] = [];
    const executeSteps: AzureWizardExecuteStep<IManagedEnvironmentContext>[] = [];

    promptSteps.push(new ManagedEnvironmentNameStep());
    executeSteps.push(new VerifyProvidersStep(['Microsoft.App', 'Microsoft.OperationalInsights']), new ResourceGroupCreateStep(), new LogAnalyticsCreateStep(), new ManagedEnvironmentCreateStep());
    LocationListStep.addProviderForFiltering(wizardContext, 'Microsoft.App', 'managedEnvironments');
    LocationListStep.addStep(wizardContext, promptSteps);

    const wizard: AzureWizard<IManagedEnvironmentContext> = new AzureWizard(wizardContext, {
        title,
        promptSteps,
        executeSteps,
        showLoadingPrompt: true
    });

    await wizard.prompt();
    const newManagedEnvName = nonNullProp(wizardContext, 'newManagedEnvironmentName');
    wizardContext.activityTitle = localize('createManagedEnvTitle', 'Create Container Apps Environment "{0}"', newManagedEnvName);
    wizardContext.newResourceGroupName = newManagedEnvName;

    await wizard.execute();
    await ext.rgApi.appResourceTree.refresh(context);

    const env = nonNullProp(wizardContext, 'managedEnvironment');
    const appResource: AppResource = {
        id: nonNullProp(env, 'id'),
        name: nonNullProp(env, 'name'),
        type: nonNullProp(env, 'type'),
        ...env
    };

    await new ContainerAppsExtResolver().resolveResource(node.subscription, appResource);
    return new ManagedEnvironmentResource(nonNullProp(wizardContext, 'managedEnvironment'), node.subscription);
}
