/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode } from "@azure/arm-appcontainers";
import type { IActionContext } from "@microsoft/vscode-azext-utils";
import { ext } from "../../extensionVariables";
import type { ContainerAppItem } from "../../tree/ContainerAppItem";
import { RevisionDraftItem } from "../../tree/revisionManagement/RevisionDraftItem";
import { delay } from "../../utils/delay";
import { localize } from "../../utils/localize";
import { pickContainerApp } from "../../utils/pickContainerApp";

export async function discardRevisionDraft(context: IActionContext, node?: ContainerAppItem | RevisionDraftItem): Promise<void> {
    const containerAppsItem = node ?? await pickContainerApp(context);
    if (!ext.revisionDraftFileSystem.doesContainerAppsItemHaveRevisionDraft(containerAppsItem)) {
        throw new Error(localize('noDraftExists', 'No draft changes exist for container app "{0}".', containerAppsItem.containerApp.name));
    }

    if (containerAppsItem.containerApp.revisionsMode === KnownActiveRevisionsMode.Single) {
        ext.revisionDraftFileSystem.discardRevisionDraft(containerAppsItem);
    } else {
        await ext.state.showDeleting(
            `${containerAppsItem.containerApp.id}/${RevisionDraftItem.idSuffix}`,
            async () => {
                // Add a short delay to display the deleting message
                await delay(5);
                ext.revisionDraftFileSystem.discardRevisionDraft(containerAppsItem);
            }
        );
    }

    ext.state.notifyChildrenChanged(containerAppsItem.containerApp.id);
}
