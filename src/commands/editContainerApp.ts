/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode } from "@azure/arm-appcontainers";
import type { IActionContext } from "@microsoft/vscode-azext-utils";
import { ext } from "../extensionVariables";
import type { ContainerAppItem } from "../tree/ContainerAppItem";
import { localize } from "../utils/localize";
import { pickContainerApp } from "../utils/pickContainerApp";

export async function editContainerApp(context: IActionContext, node?: ContainerAppItem): Promise<void> {
    node ??= await pickContainerApp(context);

    if (node.containerApp.revisionsMode !== KnownActiveRevisionsMode.Single) {
        throw new Error(localize('revisionModeError', 'The issued command can only be executed when the container app is in single revision mode.'));
    }

    await ext.revisionDraftFileSystem.editRevisionDraft(node);
}
