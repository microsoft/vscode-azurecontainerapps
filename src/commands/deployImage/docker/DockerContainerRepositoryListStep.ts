/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { QuickPickItem } from "vscode";
import { loadMoreQp, QuickPicksCache } from "../../../constants";
import { localize } from "../../../utils/localize";
import { nonNullProp } from "../../../utils/nonNull";
import { IDeployImageContext } from "../IDeployImageContext";
import { RegistryRepositoriesListStepBase } from "../RegistryRepositoriesListBaseStep";
import { getReposForNamespace } from "./DockerHubV2ApiCalls";

export class DockerContainerRepositoryListStep extends RegistryRepositoriesListStepBase {
    public async getPicks(context: IDeployImageContext, cachedPicks: QuickPicksCache): Promise<QuickPickItem[]> {
        const response = await getReposForNamespace(context, nonNullProp(context, 'dockerNamespace'), cachedPicks.next);

        if (response.count === 0) {
            await context.ui.showWarningMessage(localize('noRepos', 'Unable to find any repositories associated to namespace "{0}"', context.dockerNamespace), { modal: true });
        }

        cachedPicks.cache.push(...response.results.map((r) => { return { label: r.name, description: r.description } }));

        if (response.next) {
            cachedPicks.next = response.next;
            return cachedPicks.cache.concat(loadMoreQp);
        }

        return cachedPicks.cache;
    }
}
