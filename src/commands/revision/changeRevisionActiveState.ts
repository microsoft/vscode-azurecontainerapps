/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerAppsAPIClient } from "@azure/arm-appcontainers";
import { IActionContext, nonNullProp } from "@microsoft/vscode-azext-utils";
import { ext } from "../../extensionVariables";
import { RevisionItem } from "../../tree/revisionManagement/RevisionItem";
import { createContainerAppsClient } from "../../utils/azureClients";
import { localize } from "../../utils/localize";
import { pickContainerApp } from "../../utils/pickContainerApp";

export async function executeRevisionOperation(context: IActionContext, node: RevisionItem | undefined, operation: RevisionOperation): Promise<void> {
    const item = node ?? await pickContainerApp(context);

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
