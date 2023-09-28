/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode, Revision } from "@azure/arm-appcontainers";
import { ContainerAppModel } from "../tree/ContainerAppItem";

/**
 * Use to always select the correct parent resource model
 * https://github.com/microsoft/vscode-azurecontainerapps/blob/main/src/commands/revisionDraft/README.md
 */
export function getParentResource(containerApp: ContainerAppModel, revision: Revision): ContainerAppModel | Revision {
    return containerApp.revisionsMode === KnownActiveRevisionsMode.Single ? containerApp : revision;
}

export async function showRevisionDraftInformationPopup(): Promise<void> {

}
