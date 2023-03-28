/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { QuickPickItem } from "vscode";
import { loadMoreQp, QuickPicksCache } from "../../../../constants";
import { nonNullProp } from "../../../../utils/nonNull";
import { IContainerRegistryImageContext } from "../IContainerRegistryImageContext";
import { RepositoryTagListStepBase } from "../RepositoryTagListStepBase";
import { getTagsForRepo } from "./DockerHubV2ApiCalls";

export class DockerHubContainerTagListStep extends RepositoryTagListStepBase {
    public async getPicks(context: IContainerRegistryImageContext, cachedPicks: QuickPicksCache): Promise<QuickPickItem[]> {
        const response = await getTagsForRepo(context, nonNullProp(context, 'dockerHubNamespace'), nonNullProp(context, 'repositoryName'), cachedPicks.next);

        cachedPicks.cache.push(...response.results.map((t) => { return { label: t.name } }));

        if (response.next) {
            cachedPicks.next = response.next;
            return cachedPicks.cache.concat(loadMoreQp);
        }

        return cachedPicks.cache;
    }
}
