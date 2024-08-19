/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { LocationListStep, ResourceGroupCreateStep } from "@microsoft/vscode-azext-azureutils";
import { AzureWizard, createSubscriptionContext, nonNullValue, subscriptionExperience, type AzureWizardExecuteStep, type AzureWizardPromptStep, type IActionContext } from "@microsoft/vscode-azext-utils";
import { type AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { ext } from "../../../../../../extensionVariables";
import { createActivityContext } from "../../../../../../utils/activityUtils";
import { getVerifyProvidersStep } from "../../../../../../utils/getVerifyProvidersStep";
import { localize } from "../../../../../../utils/localize";
import { type CreateAcrContext } from "./CreateAcrContext";
import { RegistryCreateStep } from "./RegistryCreateStep";
import { RegistryNameStep } from "./RegistryNameStep";
import { SkuListStep } from "./SkuListStep";

export async function createAcr(context: IActionContext, node?: { subscription: AzureSubscription }): Promise<void> {
    const subscription = node?.subscription ?? await subscriptionExperience(context, ext.rgApiV2.resources.azureResourceTreeDataProvider);

    const wizardContext: CreateAcrContext = {
        ...context,
        ...createSubscriptionContext(subscription),
        ...(await createActivityContext())
    };

    const title: string = localize('createAcr', "Create Azure Container Registry");

    const promptSteps: AzureWizardPromptStep<CreateAcrContext>[] = [
        new RegistryNameStep(),
        new SkuListStep(),
    ];

    const executeSteps: AzureWizardExecuteStep<CreateAcrContext>[] = [
        getVerifyProvidersStep<CreateAcrContext>(),
        new ResourceGroupCreateStep(),
        new RegistryCreateStep(),
    ];

    LocationListStep.addStep(wizardContext, promptSteps);


    const wizard: AzureWizard<CreateAcrContext> = new AzureWizard(wizardContext, {
        title,
        promptSteps,
        executeSteps,
        showLoadingPrompt: true
    });

    await wizard.prompt();

    wizardContext.newResourceGroupName = nonNullValue(wizardContext.newRegistryName);
    wizardContext.activityTitle = localize('createAcr', 'Create Azure Container Registry "{0}"', wizardContext.newRegistryName);

    await wizard.execute();
}
