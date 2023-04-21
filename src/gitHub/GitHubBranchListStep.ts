/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, IAzureQuickPickItem, nonNullProp } from "@microsoft/vscode-azext-utils";
import { QuickPickItem } from "vscode";
import { loadMoreQp } from "../constants";
import { localize } from "../utils/localize";
import { IGitHubContext } from "./IGitHubContext";
import { Branches, GetBranchesParams, getBranches } from "./getBranches";

export class GitHubBranchListStep extends AzureWizardPromptStep<IGitHubContext> {
    picks: IAzureQuickPickItem<string>[];

    public async prompt(context: IGitHubContext): Promise<void> {
        // We always want fresh picks before prompting in case the user has pressed the back button
        this.picks = [];

        const placeHolder: string = localize('githubBranch', 'Choose a GitHub branch');

        let page: number = 0;
        while (!context.gitHubBranch) {
            page++;
            context.gitHubBranch = (await context.ui.showQuickPick(this.getPicks(context, page), { placeHolder })).data;
        }

        context.valuesToMask.push(context.gitHubBranch);
    }

    public shouldPrompt(context: IGitHubContext): boolean {
        return !context.gitHubBranch;
    }

    private async getPicks(context: IGitHubContext, page: number): Promise<IAzureQuickPickItem<string | undefined>[]> {
        const perPage: number = 50;
        const branchParams: GetBranchesParams = {
            owner: nonNullProp(context, 'gitHubRepositoryOwner'),
            repo: nonNullProp(context, 'gitHubRepository'),
            per_page: perPage,
            page
        };
        const branches: Branches = await getBranches(context, branchParams);

        this.picks.push(...branches.map((branch) => { return { label: branch.name, data: branch.name }}));

        this.picks.sort((a: QuickPickItem, b: QuickPickItem) => {
            if (a.label === 'main' || a.label === 'master') {
                return -1;
            } else if (b.label === 'main' || b.label === 'master') {
                return 1;
            } else {
                return a.label.localeCompare(b.label);
            }
        });

        const maxAvailablePicks: number = perPage * page;
        return maxAvailablePicks === this.picks.length ? [...this.picks, loadMoreQp] : this.picks;
    }
}
