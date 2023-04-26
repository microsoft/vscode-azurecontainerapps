/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, IAzureQuickPickItem } from "@microsoft/vscode-azext-utils";
import { localize } from "../utils/localize";
import { IGitHubContext } from "./IGitHubContext";
import { AuthenticatedUser, getAuthenticatedUser } from "./getAuthenticatedUser";
import { Orgs, getOrgs } from "./getOrgs";

export class GitHubOrgListStep extends AzureWizardPromptStep<IGitHubContext> {
    public async prompt(context: IGitHubContext): Promise<void> {
        const placeHolder: string = localize('gitHubOrganization', 'Select a GitHub organization');
        context.gitHubOrg = (await context.ui.showQuickPick(this.getPicks(context), { placeHolder })).data;

        if (context.gitHubOrg) {
            context.valuesToMask.push(context.gitHubOrg);
        }
    }

    public shouldPrompt(context: IGitHubContext): boolean {
        return !context.gitHubOrg;
    }

    private async getPicks(context: IGitHubContext): Promise<IAzureQuickPickItem<string | undefined>[]> {
        const user: AuthenticatedUser = await getAuthenticatedUser(context);
        const orgs: Orgs = await getOrgs(context);
        return [
            { label: user.login, data: undefined },
            ...orgs.map((org) => {
                return { label: org.login, data: org.login };
            })
        ];
    }
}

