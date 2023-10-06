/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode, Revision } from "@azure/arm-appcontainers";
import { ContainerAppItem, ContainerAppModel } from "../tree/ContainerAppItem";
import type { RevisionsItemModel } from "../tree/revisionManagement/RevisionItem";

/**
 * Use to always select the correct parent resource model
 * https://github.com/microsoft/vscode-azurecontainerapps/blob/main/src/commands/revisionDraft/README.md
 */
export function getParentResource(containerApp: ContainerAppModel, revision: Revision): ContainerAppModel | Revision {
    return containerApp.revisionsMode === KnownActiveRevisionsMode.Single ? containerApp : revision;
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
