/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode } from "@azure/arm-appcontainers";
import { uiUtils } from "@microsoft/vscode-azext-azureutils";
import { nonNullValue } from "@microsoft/vscode-azext-utils";
import { type QuickPickItem } from "vscode";
import { acrDomain, currentlyDeployedPickDescription, noMatchingResourcesQp } from "../../../../../constants";
import { createContainerRegistryClient } from "../../../../../utils/azureClients";
import { parseImageName } from "../../../../../utils/imageNameUtils";
import { type ContainerRegistryImageSourceContext } from "../ContainerRegistryImageSourceContext";
import { RegistryRepositoriesListStepBase } from "../RegistryRepositoriesListBaseStep";
import { getLatestContainerAppImage } from "../getLatestContainerImage";

export class AcrRepositoriesListStep extends RegistryRepositoriesListStepBase {
    public async getPicks(context: ContainerRegistryImageSourceContext): Promise<QuickPickItem[]> {
        const client = createContainerRegistryClient(context, nonNullValue(context.registry));
        const repositoryNames: string[] = await uiUtils.listAllIterator(client.listRepositoryNames());

        let suggestedRepository: string | undefined;
        let srExists: boolean = false;
        if (context.containerApp) {
            const { registryDomain, registryName, repositoryName } = parseImageName(getLatestContainerAppImage(context.containerApp, context.containersIdx ?? 0));
            if (
                context.containerApp.revisionsMode === KnownActiveRevisionsMode.Single &&
                registryDomain === acrDomain &&
                registryName && context.registry?.loginServer?.includes(registryName)
            ) {
                suggestedRepository = repositoryName;
            }

            // Move suggested repository to the front of the list
            const srIndex: number = repositoryNames.findIndex((rn) => !!suggestedRepository && rn === suggestedRepository);
            srExists = srIndex !== -1;
            if (srExists) {
                const sr: string = repositoryNames.splice(srIndex, 1)[0];
                repositoryNames.unshift(sr);
            }
        }

        if (!repositoryNames.length) {
            return [noMatchingResourcesQp];
        }

        // Prefer 'suppressPersistence: true' to avoid the possibility of a double parenthesis appearing in the description
        return repositoryNames.map((rn) => {
            return !!suggestedRepository && rn === suggestedRepository ?
                { label: rn, description: currentlyDeployedPickDescription, suppressPersistence: true } :
                { label: rn, suppressPersistence: srExists };
        });
    }
}
