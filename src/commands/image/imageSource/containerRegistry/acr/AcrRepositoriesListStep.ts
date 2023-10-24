/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { uiUtils } from "@microsoft/vscode-azext-azureutils";
import { nonNullValue } from "@microsoft/vscode-azext-utils";
import type { QuickPickItem } from "vscode";
import { acrDomain, currentlyDeployed, noMatchingResourcesQp, quickStartImageName } from "../../../../../constants";
import { createContainerRegistryClient } from "../../../../../utils/azureClients";
import { parseImageName } from "../../../../../utils/imageNameUtils";
import { ContainerRegistryImageContext } from "../IContainerRegistryImageContext";
import { RegistryRepositoriesListStepBase } from "../RegistryRepositoriesListBaseStep";
import { getLatestContainerAppImage } from "../getLatestContainerImage";

export class AcrRepositoriesListStep extends RegistryRepositoriesListStepBase {
    public async getPicks(context: ContainerRegistryImageContext): Promise<QuickPickItem[]> {
        const client = createContainerRegistryClient(context, nonNullValue(context.registry));
        const repositoryNames: string[] = await uiUtils.listAllIterator(client.listRepositoryNames());

        // Try to suggest a repository only when deploying to a Container App
        let suggestedRepository: string | undefined;
        let srExists: boolean = false;
        if (context.containerApp) {
            const { registryDomain, repositoryName, imageNameReference } = parseImageName(getLatestContainerAppImage(context.containerApp));

            // If the image is not the default quickstart image, then we can try to suggest a repository based on the latest Container App image
            if (registryDomain === acrDomain && imageNameReference !== quickStartImageName) {
                suggestedRepository = repositoryName;
            }

            // Does the suggested repositoryName exist in the list of pulled repositories?  If so, move it to the front of the list
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

        // Preferring 'suppressPersistence: true' over 'priority: highest' to avoid the possibility of a double parenthesis appearing in the description
        return repositoryNames.map((rn) => {
            return !!suggestedRepository && rn === suggestedRepository ?
                { label: rn, description: currentlyDeployed, suppressPersistence: true } :
                { label: rn, suppressPersistence: srExists };
        });
    }
}
