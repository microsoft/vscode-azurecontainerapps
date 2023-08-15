/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { gitHubUrlParse } from "@microsoft/vscode-azext-github";
import { AzureWizardPromptStep, nonNullValueAndProp } from "@microsoft/vscode-azext-utils";
import { localize } from "../../../utils/localize";
import { IDisconnectRepoContext } from "./IDisconnectRepoContext";

export class DisconnectRepositoryConfirmStep extends AzureWizardPromptStep<IDisconnectRepoContext> {
    public async prompt(context: IDisconnectRepoContext): Promise<void> {
        const { ownerOrOrganization: owner, repositoryName: repo } = gitHubUrlParse(nonNullValueAndProp(context.sourceControl, 'repoUrl'));

        await context.ui.showWarningMessage(
            localize('disconnectRepositoryWarning', 'Disconnect from GitHub repository "{0}"? \n\nThis will not affect your container app\'s active deployment. You may reconnect a repository at any time.', `${owner}/${repo}`),
            { modal: true },
            { title: localize('continue', 'Continue') }
        );
    }

    public shouldPrompt(context: IDisconnectRepoContext): boolean {
        return !!context.sourceControl;
    }
}
