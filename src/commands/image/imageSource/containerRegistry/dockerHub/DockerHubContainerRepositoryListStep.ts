/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode } from "@azure/arm-appcontainers";
import { nonNullProp } from "@microsoft/vscode-azext-utils";
import { type QuickPickItem } from "vscode";
import { currentlyDeployed, dockerHubDomain, loadMoreQp, noMatchingResourcesQp, type QuickPicksCache } from "../../../../../constants";
import { parseImageName } from "../../../../../utils/imageNameUtils";
import { type ContainerRegistryImageSourceContext } from "../ContainerRegistryImageSourceContext";
import { RegistryRepositoriesListStepBase } from "../RegistryRepositoriesListBaseStep";
import { getLatestContainerAppImage } from "../getLatestContainerImage";
import { getReposForNamespace } from "./DockerHubV2ApiCalls";
import { type DockerHubV2Repository } from "./DockerHubV2Types";

export class DockerHubContainerRepositoryListStep extends RegistryRepositoriesListStepBase {
    public async getPicks(context: ContainerRegistryImageSourceContext, cachedPicks: QuickPicksCache): Promise<QuickPickItem[]> {
        const response = await getReposForNamespace(context, nonNullProp(context, 'dockerHubNamespace'), cachedPicks.next);
        if (response.count === 0) {
            return [noMatchingResourcesQp];
        }

        let suggestedRepository: string | undefined;
        let srExists: boolean = false;
        if (context.containerApp) {
            const { registryDomain, namespace, repositoryName } = parseImageName(getLatestContainerAppImage(context.containerApp, context.containersIdx ?? 0));
            if (
                context.containerApp.revisionsMode === KnownActiveRevisionsMode.Single &&
                registryDomain === dockerHubDomain &&
                context.dockerHubNamespace === namespace
            ) {
                suggestedRepository = repositoryName;
            }

            // Move suggested repository to the front of the list
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
