/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode, type ContainerAppsAPIClient } from "@azure/arm-appcontainers";
import { nonNullProp, nonNullValue, type IActionContext } from "@microsoft/vscode-azext-utils";
import { ext } from "../../extensionVariables";
import { type ContainerAppItem } from "../../tree/ContainerAppItem";
import { RevisionItem } from "../../tree/revisionManagement/RevisionItem";
import { createContainerAppsClient } from "../../utils/azureClients";
import { localize } from "../../utils/localize";
import { pickContainerApp } from "../../utils/pickItem/pickContainerApp";
import { pickRevision } from "../../utils/pickItem/pickRevision";

export async function executeRevisionOperation(context: IActionContext, node: ContainerAppItem | RevisionItem | undefined, operation: RevisionOperation): Promise<void> {
    if (!node) {
        node = await pickContainerApp(context);

        if (node.containerApp.revisionsMode === KnownActiveRevisionsMode.Multiple) {
            node = await pickRevision(context, node);
        }
    }

    const item: ContainerAppItem | RevisionItem = nonNullValue(node);

    await ext.state.runWithTemporaryDescription(item.id, revisionOperationDescriptions[operation], async () => {
        const appClient: ContainerAppsAPIClient = await createContainerAppsClient(context, item.subscription);
        const revisionName: string = item instanceof RevisionItem ? nonNullProp(item.revision, 'name') : nonNullProp(item.containerApp, 'latestRevisionName');
        await appClient.containerAppsRevisions[operation](item.containerApp.resourceGroup, item.containerApp.name, revisionName);
        ext.state.notifyChildrenChanged(item.containerApp.id);
    });
}

const revisionOperationDescriptions = {
    activateRevision: localize('activating', 'Activating...'),
    deactivateRevision: localize('deactivating', 'Deactivating...'),
    restartRevision: localize('restarting', 'Restarting...'),
} satisfies Partial<Record<keyof ContainerAppsAPIClient['containerAppsRevisions'], string>>;

export type RevisionOperation = keyof typeof revisionOperationDescriptions;
