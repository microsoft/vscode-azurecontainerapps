/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { getGitHubAccessToken } from "@microsoft/vscode-azext-github";
import { AzureWizard, createSubscriptionContext, type AzureWizardExecuteStep, type AzureWizardPromptStep, type ITreeItemPickerContext } from "@microsoft/vscode-azext-utils";
import { type ContainerAppsItem } from "../../../tree/ContainerAppsBranchDataProvider";
import { type ActionsItem } from "../../../tree/configurations/ActionsItem";
import { createActivityContext } from "../../../utils/activity/activityUtils";
import { localize } from "../../../utils/localize";
import { pickContainerApp } from "../../../utils/pickItem/pickContainerApp";
import { getContainerAppSourceControl } from "../connectToGitHub/getContainerAppSourceControl";
import { DisconnectRepositoryConfirmStep } from "./DisconnectRepositoryConfirmStep";
import { GitHubRepositoryDisconnectStep } from "./GitHubRepositoryDisconnectStep";
import { type IDisconnectRepoContext } from "./IDisconnectRepoContext";

export async function disconnectRepo(context: ITreeItemPickerContext, node?: ContainerAppsItem | ActionsItem): Promise<void> {
    if (!node) {
        context.suppressCreatePick = true;
        node = await pickContainerApp(context);
    }

    const { subscription, containerApp } = node;

    const wizardContext: IDisconnectRepoContext = {
        ...context,
        ...createSubscriptionContext(subscription),
        ...await createActivityContext(),
        subscription,
        containerApp,
        gitHubAccessToken: await getGitHubAccessToken(),
        sourceControl: await getContainerAppSourceControl(context, subscription, containerApp)
    };

    if (!wizardContext.sourceControl) {
        throw new Error(localize('repositoryNotConnected', '"{0}" is not connected to a GitHub repository.', containerApp.name));
    }

    const promptSteps: AzureWizardPromptStep<IDisconnectRepoContext>[] = [
        new DisconnectRepositoryConfirmStep()
    ];

    const executeSteps: AzureWizardExecuteStep<IDisconnectRepoContext>[] = [
        new GitHubRepositoryDisconnectStep()
    ];

    const wizard: AzureWizard<IDisconnectRepoContext> = new AzureWizard(wizardContext, {
        title: localize('disconnectRepository', 'Disconnect "{0}" from a GitHub repository', containerApp.name),
        promptSteps,
        executeSteps,
        showLoadingPrompt: true
    });

    await wizard.prompt();
    await wizard.execute();
}

