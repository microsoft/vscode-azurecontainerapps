/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizard, AzureWizardExecuteStep, ITreeItemPickerContext, createSubscriptionContext } from "@microsoft/vscode-azext-utils";
import { getGitHubAccessToken } from "../../../gitHub/getGitHubAccessToken";
import { ContainerAppsItem } from "../../../tree/ContainerAppsBranchDataProvider";
import { ActionsTreeItem } from "../../../tree/gitHub/ActionsTreeItem";
import { createActivityContext } from "../../../utils/activityUtils";
import { localize } from "../../../utils/localize";
import { pickContainerApp } from "../../../utils/pickItem/pickContainerApp";
import { isGitHubConnected } from "../connectToGitHub/isGitHubConnected";
import { GitHubRepositoryDisconnectStep } from "./GitHubRepositoryDisconnectStep";
import { IDisconnectRepoContext } from "./IDisconnectRepoContext";

export async function disconnectRepo(context: ITreeItemPickerContext & Partial<IDisconnectRepoContext>, node?: ContainerAppsItem | ActionsTreeItem): Promise<void> {
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
        targetContainer: containerApp,
        gitHubAccessToken: await getGitHubAccessToken()
    };

    if (!await isGitHubConnected(wizardContext)) {
        throw new Error(localize('repositoryNotConnected', '"{0}" is not connected to a GitHub repository.', containerApp.name));
    }

    const title: string = localize('disconnectRepository', 'Disconnect "{0}" from a GitHub repository', containerApp.name);

    const executeSteps: AzureWizardExecuteStep<IDisconnectRepoContext>[] = [
        new GitHubRepositoryDisconnectStep()
    ];

    const wizard: AzureWizard<IDisconnectRepoContext> = new AzureWizard(wizardContext, {
        title,
        executeSteps,
        showLoadingPrompt: true
    });

    // Title normally gets set during prompt phase... since no prompt steps are provided we must set the 'activityTitle' manually
    wizardContext.activityTitle = title;
    await wizard.execute();
}

