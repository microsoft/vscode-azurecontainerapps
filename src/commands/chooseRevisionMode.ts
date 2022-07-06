/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IActionContext, IAzureQuickPickItem } from "@microsoft/vscode-azext-utils";
import { ProgressLocation, window } from "vscode";
import { appFilter, RevisionConstants } from "../constants";
import { ext } from "../extensionVariables";
import { ContainerAppResource } from "../resolver/ContainerAppResource";
import { ContainerAppExtParentTreeItem } from "../tree/ContainerAppExtParentTreeItem";
import { RevisionsResource } from "../tree/RevisionsResource";
import { localize } from "../utils/localize";
import { getRevisionMode } from "./containerApp/getRevisionMode";
import { updateContainerApp } from "./updateContainerApp";

export async function chooseRevisionMode(context: IActionContext, node?: ContainerAppExtParentTreeItem<ContainerAppResource | RevisionsResource>): Promise<void> {
    if (!node) {
        node = await ext.rgApi.pickAppResource(context, {
            filter: appFilter,
        }) as ContainerAppExtParentTreeItem<ContainerAppResource>;
    }

    const containerApp = node.resource.containerApp;
    const picks: IAzureQuickPickItem<string>[] = [RevisionConstants.single, RevisionConstants.multiple];
    const placeHolder = localize('chooseRevision', 'Choose revision mode');

    for (const pick of picks) {
        pick.description = pick.data === getRevisionMode(containerApp) ? localize('current', ' current') : undefined;
    }

    const result = await context.ui.showQuickPick(picks, { placeHolder, suppressPersistence: true });

    // only update it if it's actually different
    if (getRevisionMode(containerApp) !== result.data) {
        const updating = localize('updatingRevision', 'Updating revision mode of "{0}" to "{1}"...', containerApp.name, result.data);
        const updated = localize('updatedRevision', 'Updated revision mode of "{0}" to "{1}".', containerApp.name, result.data);

        await window.withProgress({ location: ProgressLocation.Notification, title: updating }, async (): Promise<void> => {
            ext.outputChannel.appendLog(updating);

            await updateContainerApp(context, containerApp, { configuration: { activeRevisionsMode: result.data } });

            void window.showInformationMessage(updated);
            ext.outputChannel.appendLog(updated);

            await ext.rgApi.appResourceTree.refresh(context, node);
        });
    }
}
