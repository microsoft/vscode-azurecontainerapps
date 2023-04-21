/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, ITreeItemPickerContext, createSubscriptionContext } from "@microsoft/vscode-azext-utils";
import { GitHubOrgListStep } from "../../gitHub/GitHubOrgListStep";
import { GitHubRepositoryListStep } from "../../gitHub/GitHubRepositoryListStep";
import { getGitHubAccessToken } from "../../gitHub/getGitHubAccessToken";
import { ContainerAppItem } from "../../tree/ContainerAppItem";
import { createActivityContext } from "../../utils/activityUtils";
import { localize } from "../../utils/localize";
import { pickContainerApp } from "../../utils/pickContainerApp";
import { IConnectToGitHubContext } from "./IConnectToGitHubContext";

export async function connectToGitHub(context: ITreeItemPickerContext & Partial<IConnectToGitHubContext>, node?: ContainerAppItem): Promise<void> {
    if (!node) {
        context.suppressCreatePick = true;
        node = await pickContainerApp(context);
    }

    const { subscription, containerApp } = node;

    const wizardContext: IConnectToGitHubContext = {
        ...context,
        ...createSubscriptionContext(subscription),
        ...await createActivityContext(),
        subscription,
        targetContainer: containerApp,
        gitHubAccessToken: await getGitHubAccessToken()
    };

    const title: string = localize('connectGitHubRepository', 'Connect GitHub Repository');

    // Todo: Add progress reports...
    const promptSteps: AzureWizardPromptStep<IConnectToGitHubContext>[] = [
        new GitHubOrgListStep(),
        new GitHubRepositoryListStep(),
        // new GithubBranchListStep(),
        // new DockerfileLocationStep(),
        // new AcrListStep(),
        // new AcrRepositoriesListStep(),
        // new ServicePrincipalIdInputStep(),
        // new ServicePrincipalSecretInputStep()
    ];

    const executeSteps: AzureWizardExecuteStep<IConnectToGitHubContext>[] = [
        // new GithubActionCreateStep()
    ];

    const wizard: AzureWizard<IConnectToGitHubContext> = new AzureWizard(wizardContext, {
        title,
        promptSteps,
        executeSteps,
        showLoadingPrompt: true
    });

    await wizard.prompt();
    await wizard.execute();

    throw new Error("'connectToGitHub' is not fully implemented yet.");
}

