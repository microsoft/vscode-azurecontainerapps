/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ArtifactManifestProperties } from "@azure/container-registry";
import { uiUtils } from "@microsoft/vscode-azext-azureutils";
import { QuickPickItem } from "vscode";
import { createContainerRegistryClient } from "../../../../utils/azureClients";
import { nonNullProp, nonNullValue } from "../../../../utils/nonNull";
import { IDeployImageContext } from "../IDeployImageContext";
import { RepositoryTagListStepBase } from "../RepositoryTagListStepBase";

export class AcrTagListStep extends RepositoryTagListStepBase {
    public async getPicks(context: IDeployImageContext): Promise<QuickPickItem[]> {
        const client = createContainerRegistryClient(context, nonNullValue(context.registry));
        const repoClient = client.getRepository(nonNullProp(context, 'repositoryName'));

        const manifests: ArtifactManifestProperties[] = await uiUtils.listAllIterator(repoClient.listManifestProperties());
        return manifests[0].tags.map((t) => { { return { label: t } } });
    }
}
