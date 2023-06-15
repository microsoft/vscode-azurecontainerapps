/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IActionContext } from "@microsoft/vscode-azext-utils";
import { ext } from "../../extensionVariables";
import { RevisionDraftItem } from "../../tree/revisionManagement/RevisionDraftItem";
import { localize } from "../../utils/localize";
import { pickRevision } from "../../utils/pickItem/pickRevision";

export async function editRevisionDraft(context: IActionContext, node?: RevisionDraftItem): Promise<void> {
    const revisionItem = node ?? await pickRevision(context);
    if (!ext.revisionDraftFileSystem.doesContainerAppsItemHaveRevisionDraft(revisionItem)) {
        // Todo: Prompt the user to create a draft if one doesn't exist
        throw new Error(localize('noRevisionDraftExists', 'No revision draft exists for container app "{0}".', revisionItem.containerApp.name));
    }

    await ext.revisionDraftFileSystem.createOrEditRevisionDraft(revisionItem);
}
