/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ArtifactManifestProperties } from "@azure/container-registry";
import { QuickPickItem } from "vscode";
import { createContainerRegistryClient } from "../../../utils/azureClients";
import { nonNullProp, nonNullValue } from "../../../utils/nonNull";
import { IDeployImageContext } from "../IDeployImageContext";
import { RepositoryTagListStepBase } from "../RepositoryTagListStepBase";

export class AcrTagListStep extends RepositoryTagListStepBase {
    public async getPicks(context: IDeployImageContext): Promise<QuickPickItem[]> {
        const client = createContainerRegistryClient(nonNullValue(context.registry));
        const manifests: ArtifactManifestProperties[] = [];

        for await (const manifest of client.getRepository(nonNullProp(context, 'repositoryName')).listManifestProperties()) {
            manifests.push(manifest);
        }

        return manifests[0].tags.map((t) => { { return { label: t } } });
    }
}
