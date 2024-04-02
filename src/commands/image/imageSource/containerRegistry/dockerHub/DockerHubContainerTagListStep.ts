/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { nonNullProp } from "@microsoft/vscode-azext-utils";
import { type QuickPickItem } from "vscode";
import { loadMoreQp, type QuickPicksCache } from "../../../../../constants";
import { type ContainerRegistryImageSourceContext } from "../ContainerRegistryImageSourceContext";
import { RepositoryTagListStepBase } from "../RepositoryTagListStepBase";
import { getTagsForRepo } from "./DockerHubV2ApiCalls";

export class DockerHubContainerTagListStep extends RepositoryTagListStepBase {
    public async getPicks(context: ContainerRegistryImageSourceContext, cachedPicks: QuickPicksCache): Promise<QuickPickItem[]> {
        const response = await getTagsForRepo(context, nonNullProp(context, 'dockerHubNamespace'), nonNullProp(context, 'repositoryName'), cachedPicks.next);

        cachedPicks.cache.push(...response.results.map((t) => { return { label: t.name } }));

        if (response.next) {
            cachedPicks.next = response.next;
            return cachedPicks.cache.concat(loadMoreQp);
        }

        return cachedPicks.cache;
    }
}
