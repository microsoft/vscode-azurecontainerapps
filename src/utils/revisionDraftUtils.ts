/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode, type Revision } from "@azure/arm-appcontainers";
import { nonNullProp } from "@microsoft/vscode-azext-utils";
import { ext } from "../extensionVariables";
import { ContainerAppItem, type ContainerAppModel } from "../tree/ContainerAppItem";
import { RevisionDraftItem } from "../tree/revisionManagement/RevisionDraftItem";
import { type RevisionsItemModel } from "../tree/revisionManagement/RevisionItem";
import { localize } from "./localize";

/**
 * Use to always select the correct parent resource model
 * https://github.com/microsoft/vscode-azurecontainerapps/blob/main/src/commands/revisionDraft/README.md
 */
export function getParentResource(containerApp: ContainerAppModel, revision: Revision): ContainerAppModel | Revision {
    return containerApp.revisionsMode === KnownActiveRevisionsMode.Single ? containerApp : revision;
}

export function getParentResourceFromCache(containerApp: ContainerAppModel, revision: Revision): ContainerAppModel | Revision | undefined {
    return containerApp.revisionsMode === KnownActiveRevisionsMode.Single ? ext.resourceCache.get(containerApp.id) : ext.resourceCache.get(nonNullProp(revision, 'id'));
}

/**
 * Use to always select the correct parent resource model from an item
 * https://github.com/microsoft/vscode-azurecontainerapps/blob/main/src/commands/revisionDraft/README.md
 */
export function getParentResourceFromItem(item: ContainerAppItem | RevisionsItemModel): ContainerAppModel | Revision {
    if (ContainerAppItem.isContainerAppItem(item) || item.containerApp.revisionsMode === KnownActiveRevisionsMode.Single) {
        return item.containerApp;
    } else {
        return item.revision;
    }
}

/**
 * Checks to see whether a given container app template item is in an editable state
 * (Template item here refers to any tree item descendant of the RevisionItem - see 'RevisionItem.getTemplateChildren')
 * (The name template originates from the container app envelope's 'template' set of properties which happen to also be tied to each revision)
 */
export function isTemplateItemEditable(item: RevisionsItemModel): boolean {
    // Rule 1: Single revision edits are always okay
    // Rule 2: If in multiple revisions mode and no draft is in session, revision edits are always okay
    // Rule 3: If in multiple revisions mode and a draft is in session, do not allow any other edits besides those on the draft item
    return item.containerApp.revisionsMode === KnownActiveRevisionsMode.Single ||
        !ext.revisionDraftFileSystem.doesContainerAppsItemHaveRevisionDraft(item) ||
        RevisionDraftItem.hasDescendant(item);
}

/**
 * If a template item is not editable, throw this error to cancel and alert the user
 */
export function throwTemplateItemNotEditable(item: RevisionsItemModel) {
    throw new Error(localize('itemNotEditable', 'Action cannot be performed on revision "{0}" because a draft is currently active.', item.revision.name));
}
