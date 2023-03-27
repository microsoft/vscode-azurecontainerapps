/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { uiUtils } from "@microsoft/vscode-azext-azureutils";
import { QuickPickItem } from "vscode";
import { acrDomain, latestImage, quickStartImageName } from "../../../../constants";
import type { ContainerAppModel } from "../../../../tree/ContainerAppItem";
import { createContainerRegistryClient } from "../../../../utils/azureClients";
import { parseImageName } from "../../../../utils/imageNameUtils";
import { nonNullProp, nonNullValue } from "../../../../utils/nonNull";
import { IContainerRegistryImageContext } from "../IContainerRegistryImageContext";
import { RegistryRepositoriesListStepBase } from "../RegistryRepositoriesListBaseStep";
import { getLatestContainerAppImage } from "../getLatestContainerImage";

export class AcrRepositoriesListStep extends RegistryRepositoriesListStepBase {
    public async getPicks(context: IContainerRegistryImageContext): Promise<QuickPickItem[]> {
        const client = createContainerRegistryClient(context, nonNullValue(context.registry));
        const repositoryNames: string[] = await uiUtils.listAllIterator(client.listRepositoryNames());

        const containerApp: ContainerAppModel = nonNullProp(context, 'targetContainer');
        const { registryDomain, repositoryName, referenceImageName } = parseImageName(getLatestContainerAppImage(containerApp));

        // If the image is not the default quickstart image, then we can try to suggest a repository based on the latest Container App image
        let predictedRepository: string | undefined;
        if (registryDomain === acrDomain && referenceImageName !== quickStartImageName) {
            predictedRepository = repositoryName;
        }

        // Does the predicted repositoryName exist in the list of pulled repositories?  If so, move it to the front of the list
        const prIndex: number = repositoryNames.findIndex((rn) => !!predictedRepository && rn === predictedRepository);
        const prExists: boolean = prIndex !== -1;

        if (prExists) {
            const pr: string = repositoryNames.splice(prIndex, 1)[0];
            repositoryNames.unshift(pr);
        }

        // Preferring 'suppressPersistence: true' over 'priority: highest' to avoid the possibility of a double parenthesis appearing in the description
        return repositoryNames.map((rn) => {
            return !!predictedRepository && rn === predictedRepository ?
                { label: rn, description: latestImage, suppressPersistence: true } :
                { label: rn, suppressPersistence: prExists };
        });
    }
}
