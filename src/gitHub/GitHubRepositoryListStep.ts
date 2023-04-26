/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, IAzureQuickPickItem } from "@microsoft/vscode-azext-utils";
import { QuickPickItem } from "vscode";
import { loadMoreQp } from "../constants";
import { localize } from "../utils/localize";
import { IGitHubContext } from "./IGitHubContext";
import { GetOrgReposReqParams, GetUserReposReqParams, getRepositoriesByOrg, getRepositoriesByUser } from "./getRepositories";

type RepositoryData = {
    owner: string;
    repo: string;
    url: string;
}

export class GitHubRepositoryListStep extends AzureWizardPromptStep<IGitHubContext> {
    picks: IAzureQuickPickItem<RepositoryData>[];

    public async prompt(context: IGitHubContext): Promise<void> {
        // We always want fresh picks before prompting in case the user has pressed the back button
        this.picks = [];

        const placeHolder: string = localize('gitHubRepository', 'Select a GitHub repository');

        let page: number = 0;
        let repositoryData: RepositoryData | undefined;
        while (!repositoryData) {
            page++;
            repositoryData = (await context.ui.showQuickPick(this.getPicks(context, page), { placeHolder })).data;
        }

        context.gitHubRepository = repositoryData.repo;
        context.gitHubRepositoryOwner = repositoryData.owner;
        context.gitHubRepositoryUrl = repositoryData.url;

        context.valuesToMask.push(context.gitHubRepository);
        context.valuesToMask.push(context.gitHubRepositoryOwner);
        context.valuesToMask.push(context.gitHubRepositoryUrl);
    }

    public shouldPrompt(context: IGitHubContext): boolean {
        return !context.gitHubRepository || !context.gitHubRepositoryOwner;
    }

    private async getPicks(context: IGitHubContext, page: number): Promise<IAzureQuickPickItem<RepositoryData | undefined>[]> {
        const perPage: number = 50;
        const userRepoParams: GetUserReposReqParams = {
            affiliation: 'owner',
            visibility: 'all',
            per_page: perPage,
            page
        };
        const orgRepoParams: GetOrgReposReqParams = {
            // Doesn't matter if context.gitHubOrg is undefined; that just means we will end up calling 'getRepositoriesByUser' instead
            org: context.gitHubOrg ?? '',
            type: 'all',
            per_page: perPage,
            page
        };

        this.picks.push(
            ...(context.gitHubOrg ?
                (await getRepositoriesByOrg(context, orgRepoParams)).map((repo) => { return { label: repo.name, data: { owner: repo.owner.login, repo: repo.name, url: repo.html_url } }}) :
                (await getRepositoriesByUser(context, userRepoParams)).map((repo) => { return { label: repo.name, data: { owner: repo.owner.login, repo: repo.name, url: repo.html_url } }}))
        );

        this.picks.sort((a: QuickPickItem, b: QuickPickItem) => a.label.localeCompare(b.label));

        const maxPicksAvailable: number = perPage * page;
        return (maxPicksAvailable === this.picks.length) ? [...this.picks, loadMoreQp] : this.picks;
    }
}

