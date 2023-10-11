/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { nonNullProp } from "@microsoft/vscode-azext-utils";
import type { QuickPickItem } from "vscode";
import { QuickPicksCache, currentlyDeployed, dockerHubDomain, loadMoreQp, noMatchingResourcesQp, quickStartImageName } from "../../../../../constants";
import { parseImageName } from "../../../../../utils/imageNameUtils";
import type { IContainerRegistryImageContext } from "../IContainerRegistryImageContext";
import { RegistryRepositoriesListStepBase } from "../RegistryRepositoriesListBaseStep";
import { getLatestContainerAppImage } from "../getLatestContainerImage";
import { getReposForNamespace } from "./DockerHubV2ApiCalls";
import type { DockerHubV2Repository } from "./DockerHubV2Types";

export class DockerHubContainerRepositoryListStep extends RegistryRepositoriesListStepBase {
    public async getPicks(context: IContainerRegistryImageContext, cachedPicks: QuickPicksCache): Promise<QuickPickItem[]> {
        const response = await getReposForNamespace(context, nonNullProp(context, 'dockerHubNamespace'), cachedPicks.next);
        if (response.count === 0) {
            return [noMatchingResourcesQp];
        }

        // Try to suggest a repository only when the user is deploying to a Container App
        let suggestedRepository: string | undefined;
        let srExists: boolean = false;
        if (context.containerApp) {
            const { registryDomain, repositoryName, imageNameReference } = parseImageName(getLatestContainerAppImage(context.containerApp));

            // If the image is not the default quickstart image, then we can try to suggest a repository based on the latest Container App image
            if (registryDomain === dockerHubDomain && imageNameReference !== quickStartImageName) {
                suggestedRepository = repositoryName;
            }

            // Does the suggested repositoryName exist in the list of pulled repositories?  If so, move it to the front of the list
            const srIndex: number = response.results.findIndex((r) => !!suggestedRepository && r.name === suggestedRepository);
            srExists = srIndex !== -1;
            if (srExists) {
                const sr: DockerHubV2Repository = response.results.splice(srIndex, 1)[0];
                response.results.unshift(sr);
            }
        }

        // Preferring 'suppressPersistence: true' over 'priority: highest' to avoid the possibility of a double parenthesis appearing in the description
        const picks: QuickPickItem[] = response.results.map((r) => {
            return !!suggestedRepository && r.name === suggestedRepository ?
                { label: r.name, description: r.description ? `${r.description} ${currentlyDeployed}` : currentlyDeployed, suppressPersistence: true } :
                { label: r.name, description: r.description, suppressPersistence: srExists }
        });
        cachedPicks.cache.push(...picks);

        if (response.next) {
            cachedPicks.next = response.next;
            return cachedPicks.cache.concat(loadMoreQp);
        }

        return cachedPicks.cache;
    }
}
