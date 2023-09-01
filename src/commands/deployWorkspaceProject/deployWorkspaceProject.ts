/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, IActionContext, ISubscriptionContext, createSubscriptionContext, subscriptionExperience } from "@microsoft/vscode-azext-utils";
import { AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { ProgressLocation, window } from "vscode";
import { ext } from "../../extensionVariables";
import { createActivityContext } from "../../utils/activityUtils";
import { localize } from "../../utils/localize";
import { DeployWorkspaceProjectContext } from "./IDeployWorkspaceProjectContext";
import { DefaultResourcesNameStep } from "./getDefaultValues/DefaultResourcesNameStep";
import { getDefaultContextValues } from "./getDefaultValues/getDefaultContextValues";

export async function deployWorkspaceProject(context: IActionContext): Promise<void> {
    ext.outputChannel.appendLog(localize('beginCommandExecution', '--------Initializing deploy workspace project--------'));

    const subscription: AzureSubscription = await subscriptionExperience(context, ext.rgApiV2.resources.azureResourceTreeDataProvider);
    const subscriptionContext: ISubscriptionContext = createSubscriptionContext(subscription);

    // Show loading indicator while we configure default values
    let defaultContextValues: Partial<DeployWorkspaceProjectContext> | undefined;
    await window.withProgress({
        location: ProgressLocation.Notification,
        cancellable: false,
        title: localize('loadingWorkspaceTitle', 'Loading workspace project deployment configurations...')
    }, async () => {
        defaultContextValues = await getDefaultContextValues({ ...context, ...subscriptionContext });
    });

    const wizardContext: DeployWorkspaceProjectContext = {
        ...context,
        ...subscriptionContext,
        ...await createActivityContext(),
        ...defaultContextValues,
        activityChildren: [],
        subscription,
    };

    const promptSteps: AzureWizardPromptStep<DeployWorkspaceProjectContext>[] = [
        // new DeployWorkspaceProjectConfirmStep(),
        new DefaultResourcesNameStep()
    ];

    const executeSteps: AzureWizardExecuteStep<DeployWorkspaceProjectContext>[] = [
        // new DeployWorkspaceProjectSaveSettingsStep()
    ];

    const wizard: AzureWizard<DeployWorkspaceProjectContext> = new AzureWizard(wizardContext, {
        title: localize('deployWorkspaceProjectTitle', 'Deploy workspace project to a container app'),
        promptSteps,
        executeSteps,
        showLoadingPrompt: true
    });

    await wizard.prompt();

    throw new Error('Not finished implementing');
}
