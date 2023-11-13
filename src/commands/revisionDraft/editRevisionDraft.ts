/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode } from "@azure/arm-appcontainers";
import { type IActionContext } from "@microsoft/vscode-azext-utils";
import { ext } from "../../extensionVariables";
import { type RevisionDraftItem } from "../../tree/revisionManagement/RevisionDraftItem";
import { localize } from "../../utils/localize";
import { pickContainerApp } from "../../utils/pickItem/pickContainerApp";

export async function editRevisionDraft(context: IActionContext, node?: RevisionDraftItem): Promise<void> {
    const containerAppsItem = node ?? await pickContainerApp(context);

    if (containerAppsItem.containerApp.revisionsMode !== KnownActiveRevisionsMode.Multiple) {
        throw new Error(localize('revisionsModeError', 'You must be in multiple revisions mode to run this command.'));
    } else if (!ext.revisionDraftFileSystem.doesContainerAppsItemHaveRevisionDraft(containerAppsItem)) {
        // Todo: Prompt the user to create a draft if one doesn't exist
        throw new Error(localize('noRevisionDraftExists', 'No revision draft exists for container app "{0}".', containerAppsItem.containerApp.name));
    }

    await ext.revisionDraftFileSystem.editRevisionDraft(containerAppsItem);
}
