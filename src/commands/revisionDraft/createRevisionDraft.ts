/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerApp, ContainerAppsAPIClient, KnownActiveRevisionsMode, Revision } from "@azure/arm-appcontainers";
import { uiUtils } from "@microsoft/vscode-azext-azureutils";
import { IActionContext, IAzureQuickPickItem, createSubscriptionContext, nonNullProp, nonNullValueAndProp } from "@microsoft/vscode-azext-utils";
import * as dayjs from "dayjs";
// eslint-disable-next-line import/no-internal-modules
import * as relativeTime from 'dayjs/plugin/relativeTime';
import { ext } from "../../extensionVariables";
import { RevisionItem } from "../../tree/revisionManagement/RevisionItem";
import { RevisionsItem } from "../../tree/revisionManagement/RevisionsItem";
import { createContainerAppsAPIClient } from "../../utils/azureClients";
import { localize } from "../../utils/localize";
import { pickContainerApp } from "../../utils/pickItem/pickContainerApp";
import { pickRevision } from "../../utils/pickItem/pickRevision";
import { IContainerAppContext } from "../IContainerAppContext";

export async function createRevisionDraft(context: IActionContext, node?: RevisionItem | RevisionsItem): Promise<void> {
    const containerAppsItem = node ?? await pickContainerApp(context);

    if (ext.revisionDraftFileSystem.hasRevisionDraft(containerAppsItem)) {
        throw new Error(localize('revisionDraftExists', 'A revision draft already exists for container app "{0}".', containerAppsItem.containerApp.name));
    }

    let revisionItem: RevisionItem;
    if (containerAppsItem instanceof RevisionItem) {
        revisionItem = containerAppsItem;
    } else {
        const { subscription, containerApp } = containerAppsItem;
        const containerAppContext: IContainerAppContext = {
            ...context,
            ...createSubscriptionContext(subscription),
            containerApp,
            subscription
        };

        /**
         * Overwrite the typical 'pickRevisionItem' behavior with custom behavior.
         * Leverage the `selectRevisionName` option to obtain the RevisionItem without re-prompting the user
         */
        const revisionName = await promptForRevisionName(containerAppContext);
        revisionItem = await pickRevision(context, containerAppsItem, {
            selectByRevisionName: revisionName
        });
    }

    let parentId: string;
    if (revisionItem.containerApp.revisionsMode === KnownActiveRevisionsMode.Single) {
        parentId = revisionItem.containerApp.id;
    } else {
        parentId = `${revisionItem.containerApp.id}/${RevisionsItem.idSuffix}`;
    }

    await ext.state.showCreatingChild(
        parentId,
        localize('creatingDraft', 'Creating draft...'),
        async () => await ext.revisionDraftFileSystem.createOrEditRevisionDraft(revisionItem)
    );
}

async function promptForRevisionName(context: IContainerAppContext): Promise<string | undefined> {
    const revisionPicks: IAzureQuickPickItem<Revision | undefined>[] = await getRevisionNamePicks(context);
    if (revisionPicks.length === 1) {
        return revisionPicks[0].data?.name;
    }

    return (await context.ui.showQuickPick(revisionPicks, {
        placeHolder: localize('selectBaseRevision', 'Select a base revision'),
        suppressPersistence: true
    })).data?.name;
}

dayjs.extend(relativeTime);

async function getRevisionNamePicks(context: IContainerAppContext): Promise<IAzureQuickPickItem<Revision | undefined>[]> {
    const rgName: string = nonNullValueAndProp(context.containerApp, 'resourceGroup');
    const caName: string = nonNullValueAndProp(context.containerApp, 'name');

    const client: ContainerAppsAPIClient = await createContainerAppsAPIClient(context);

    const containerApp: ContainerApp = await client.containerApps.get(rgName, caName);

    const revisionsIterator = client.containerAppsRevisions.listRevisions(rgName, caName);
    const revisions: Revision[] = await uiUtils.listAllIterator(revisionsIterator);

    if (context.containerApp?.revisionsMode === KnownActiveRevisionsMode.Single) {
        return [
            {
                label: 'Latest',
                data: revisions.find((revision: Revision) => revision.name === context.containerApp?.latestRevisionName)
            }
        ];
    }

    return revisions
        .map((revision: Revision) => {
            const revisionName = nonNullProp(revision, 'name');
            const day = revision.createdTime?.toLocaleDateString(undefined, {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit'
            });
            const time = revision.createdTime?.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            const timeAgo = dayjs(revision.createdTime).fromNow();

            return {
                label: revisionName === containerApp.latestRevisionName ? 'Latest' : revisionName,
                description: (day && time && timeAgo) ? `${day} ${time} (${timeAgo})` : '',
                data: revision,
            };
        })
        .sort((a: IAzureQuickPickItem<Revision>, b: IAzureQuickPickItem<Revision>) => {
            const aCreatedTime = nonNullValueAndProp(a.data, 'createdTime');
            const bCreatedTime = nonNullValueAndProp(b.data, 'createdTime');

            if (aCreatedTime > bCreatedTime) {
                return -1;
            } else if (aCreatedTime < bCreatedTime) {
                return 1;
            } else {
                return 0;
            }
        });
}
