/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ArtifactManifestProperties } from "@azure/container-registry";
import { uiUtils } from "@microsoft/vscode-azext-azureutils";
import * as dayjs from 'dayjs';
// eslint-disable-next-line import/no-internal-modules
import * as relativeTime from 'dayjs/plugin/relativeTime';
import { QuickPickItem } from "vscode";
import { createContainerRegistryClient } from "../../../../utils/azureClients";
import { nonNullProp, nonNullValue } from "../../../../utils/nonNull";
import { IContainerRegistryImageContext } from "../IContainerRegistryImageContext";
import { RepositoryTagListStepBase } from "../RepositoryTagListStepBase";

dayjs.extend(relativeTime);
export class AcrTagListStep extends RepositoryTagListStepBase {
    public async getPicks(context: IContainerRegistryImageContext): Promise<QuickPickItem[]> {
        const client = createContainerRegistryClient(context, nonNullValue(context.registry));
        const repoClient = client.getRepository(nonNullProp(context, 'repositoryName'));

        const manifests: ArtifactManifestProperties[] = await uiUtils.listAllIterator(repoClient.listManifestProperties());

        const tags = manifests.reduce((allTags: { tag: string, date: Date }[], m) => {
            const tagsWithDates = m.tags.map(t => { return { tag: t, date: m.lastUpdatedOn } });
            return allTags.concat(tagsWithDates);
        }, []);
        return tags.map((t) => { { return { label: t.tag, description: dayjs(t.date).fromNow() } } });
    }
}
