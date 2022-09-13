/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IActionContext, IAzureQuickPickItem } from "@microsoft/vscode-azext-utils";
import { ProgressLocation, window } from "vscode";
import { RevisionConstants, rootFilter } from "../constants";
import { ext } from "../extensionVariables";
import { ContainerAppTreeItem } from "../tree/ContainerAppTreeItem";
import { RevisionsTreeItem } from "../tree/RevisionsTreeItem";
import { localize } from "../utils/localize";
import { nonNullValue } from "../utils/nonNull";
import { updateContainerApp } from "./updateContainerApp";

export async function chooseRevisionMode(context: IActionContext, node?: ContainerAppTreeItem | RevisionsTreeItem): Promise<void> {
    if (!node) {
        node = await ext.rgApi.pickAppResource<ContainerAppTreeItem>(context, {
            filter: rootFilter,
            expectedChildContextValue: ContainerAppTreeItem.contextValueRegExp
        });
    }

    if (node instanceof RevisionsTreeItem) {
        node = node.parent;
    }

    const picks: IAzureQuickPickItem<string>[] = [RevisionConstants.single, RevisionConstants.multiple];
    const placeHolder = localize('chooseRevision', 'Choose revision mode');

    for (const pick of picks) {
        pick.description = pick.data === node.getRevisionMode() ? localize('current', ' current') : undefined;
    }

    const result = await context.ui.showQuickPick(picks, { placeHolder, suppressPersistence: true });

    // only update it if it's actually different
    if (node.getRevisionMode() !== result.data) {
        const updating = localize('updatingRevision', 'Updating revision mode of "{0}" to "{1}"...', node.name, result.data);
        const updated = localize('updatedRevision', 'Updated revision mode of "{0}" to "{1}".', node.name, result.data);

        await window.withProgress({ location: ProgressLocation.Notification, title: updating }, async (): Promise<void> => {
            const pNode = nonNullValue(node) as ContainerAppTreeItem;
            ext.outputChannel.appendLog(updating);

            await updateContainerApp(context, pNode, { configuration: { activeRevisionsMode: result.data } });

            void window.showInformationMessage(updated);
            ext.outputChannel.appendLog(updated);

            await node?.parent?.refresh(context);
        });
    }
}
