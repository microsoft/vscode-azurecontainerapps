/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ArtifactManifestProperties } from "@azure/container-registry";
import { uiUtils } from "@microsoft/vscode-azext-azureutils";
import { nonNullProp, nonNullValue } from "@microsoft/vscode-azext-utils";
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { type QuickPickItem } from "vscode";
import { createContainerRegistryClient } from "../../../../../utils/azureClients";
import { type ContainerRegistryImageSourceContext } from "../ContainerRegistryImageSourceContext";
import { RepositoryTagListStepBase } from "../RepositoryTagListStepBase";

dayjs.extend(relativeTime);

export class AcrTagListStep extends RepositoryTagListStepBase {
    public async getPicks(context: ContainerRegistryImageSourceContext): Promise<QuickPickItem[]> {
        const client = createContainerRegistryClient(context, nonNullValue(context.registry));
        const repoClient = client.getRepository(nonNullProp(context, 'repositoryName'));

        const manifests: ArtifactManifestProperties[] = await uiUtils.listAllIterator(repoClient.listManifestProperties());

        const tags = manifests.reduce((allTags: { tag: string, date: Date }[], m) => {
            const tagsWithDates = m.tags.map(t => { return { tag: t, date: m.lastUpdatedOn }; });
            return allTags.concat(tagsWithDates);
        }, []);
        return tags.map((t) => { { return { label: t.tag, description: dayjs(t.date).fromNow() }; } });
    }
}
