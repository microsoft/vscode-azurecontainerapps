/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, ITreeItemPickerContext, createSubscriptionContext } from "@microsoft/vscode-azext-utils";
import { GitHubBranchListStep } from "../../../gitHub/GitHubBranchListStep";
import { GitHubOrgListStep } from "../../../gitHub/GitHubOrgListStep";
import { GitHubRepositoryListStep } from "../../../gitHub/GitHubRepositoryListStep";
import { getGitHubAccessToken } from "../../../gitHub/getGitHubAccessToken";
import type { ContainerAppItem } from "../../../tree/ContainerAppItem";
import { createActivityContext } from "../../../utils/activityUtils";
import { localize } from "../../../utils/localize";
import { pickContainerApp } from "../../../utils/pickItem/pickContainerApp";
import { AcrListStep } from "../../imageSource/containerRegistry/acr/AcrListStep";
import { AcrRepositoriesListStep } from "../../imageSource/containerRegistry/acr/AcrRepositoriesListStep";
import { DockerfileLocationInputStep } from "./DockerfileLocationInputStep";
import { GitHubRepositoryConnectStep } from "./GitHubRepositoryConnectStep";
import type { IConnectToGitHubContext } from "./IConnectToGitHubContext";
import { ServicePrincipalIdInputStep } from "./ServicePrincipalIdInputStep";
import { ServicePrincipalSecretInputStep } from "./ServicePrincipalSecretInputStep";
import { isGitHubConnected } from "./isGitHubConnected";

export async function connectToGitHub(context: ITreeItemPickerContext & Partial<IConnectToGitHubContext>, item?: Pick<ContainerAppItem, 'containerApp' | 'subscription' >): Promise<void> {
    if (!item) {
        context.suppressCreatePick = true;
        item = await pickContainerApp(context);
    }

    const { subscription, containerApp } = item;

    const wizardContext: IConnectToGitHubContext = {
        ...context,
        ...createSubscriptionContext(subscription),
        ...await createActivityContext(),
        subscription,
        targetContainer: containerApp,
        gitHubAccessToken: await getGitHubAccessToken()
    };

    if (await isGitHubConnected(wizardContext)) {
        throw new Error(localize('gitHubAlreadyConnected', '"{0}" is already connected to a GitHub repository.', containerApp.name));
    }

    const title: string = localize('connectGitHubRepository', 'Connect a GitHub repository to "{0}"', containerApp.name);

    const promptSteps: AzureWizardPromptStep<IConnectToGitHubContext>[] = [
        new GitHubOrgListStep(),
        new GitHubRepositoryListStep(),
        new GitHubBranchListStep(),
        new DockerfileLocationInputStep(),
        new AcrListStep(),
        new AcrRepositoriesListStep(),
        new ServicePrincipalIdInputStep(),
        new ServicePrincipalSecretInputStep()
    ];

    const executeSteps: AzureWizardExecuteStep<IConnectToGitHubContext>[] = [
        new GitHubRepositoryConnectStep()
    ];

    const wizard: AzureWizard<IConnectToGitHubContext> = new AzureWizard(wizardContext, {
        title,
        promptSteps,
        executeSteps,
        showLoadingPrompt: true
    });

    await wizard.prompt();
    await wizard.execute();
}

