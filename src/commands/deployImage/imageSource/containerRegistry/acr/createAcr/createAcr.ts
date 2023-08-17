/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { LocationListStep, ResourceGroupCreateStep } from "@microsoft/vscode-azext-azureutils";
import { AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, IActionContext, createSubscriptionContext, nonNullValue, subscriptionExperience } from "@microsoft/vscode-azext-utils";
import { AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { ext } from "../../../../../../extensionVariables";
import { createActivityContext } from "../../../../../../utils/activityUtils";
import { localize } from "../../../../../../utils/localize";
import { ICreateAcrContext } from "./ICreateAcrContext";
import { RegistryCreateStep } from "./RegistryCreateStep";
import { RegistryNameStep } from "./RegistryNameStep";
import { SkuListStep } from "./SkuListStep";

export async function createAcr(context: IActionContext, node?: { subscription: AzureSubscription }): Promise<void> {
    const subscription = node?.subscription ?? await subscriptionExperience(context, ext.rgApiV2.resources.azureResourceTreeDataProvider);

    const wizardContext: ICreateAcrContext = {
        ...context,
        ...createSubscriptionContext(subscription),
        ...(await createActivityContext())
    };

    const title: string = localize('createAcr', "Create container registry");

    const promptSteps: AzureWizardPromptStep<ICreateAcrContext>[] = [
        new RegistryNameStep(),
        new SkuListStep(),
    ];

    const executeSteps: AzureWizardExecuteStep<ICreateAcrContext>[] = [
        new ResourceGroupCreateStep(),
        new RegistryCreateStep(),
    ];

    LocationListStep.addStep(wizardContext, promptSteps);


    const wizard: AzureWizard<ICreateAcrContext> = new AzureWizard(wizardContext, {
        title,
        promptSteps,
        executeSteps,
        showLoadingPrompt: true
    });

    await wizard.prompt();

    wizardContext.newResourceGroupName = nonNullValue(wizardContext.registryName);
    wizardContext.activityTitle = localize('createAcr', 'Create Azure Container Registry "{0}"', wizardContext.registryName);

    await wizard.execute();
}
