/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IActionContext } from "@microsoft/vscode-azext-utils";
import { ext } from "../../extensionVariables";
import { RevisionDraftItem } from "../../tree/revisionManagement/RevisionDraftItem";
import { localize } from "../../utils/localize";
import { pickContainerApp } from "../../utils/pickItem/pickContainerApp";

export async function discardRevisionDraft(context: IActionContext, node?: RevisionDraftItem): Promise<void> {
    const containerAppsItem = node ?? await pickContainerApp(context);
    if (!ext.revisionDraftFileSystem.doesContainerAppsItemHaveRevisionDraft(containerAppsItem)) {
        throw new Error(localize('noRevisionDraftExists', 'No revision draft exists for container app "{0}".', containerAppsItem.containerApp.name));
    }

    await ext.state.showDeleting(
        `${containerAppsItem.containerApp.id}/${RevisionDraftItem.idSuffix}`,
        async () => await ext.revisionDraftFileSystem.discardRevisionDraft(containerAppsItem)
    );
    ext.state.notifyChildrenChanged(containerAppsItem.containerApp.id);
}
