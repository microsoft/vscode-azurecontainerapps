/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode } from "@azure/arm-appcontainers";
import type { IActionContext, IAzureQuickPickItem } from "@microsoft/vscode-azext-utils";
import { ProgressLocation, window } from "vscode";
import { ext } from "../../extensionVariables";
import type { ContainerAppItem, ContainerAppModel } from "../../tree/ContainerAppItem";
import type { RevisionsItem } from "../../tree/revisionManagement/RevisionsItem";
import { localize } from "../../utils/localize";
import { pickContainerApp } from "../../utils/pickContainerApp";
import { updateContainerApp } from "../deployContainerApp/updateContainerApp";

export async function chooseRevisionMode(context: IActionContext, node?: ContainerAppItem | RevisionsItem): Promise<void> {
    const { subscription, containerApp } = node ?? await pickContainerApp(context);

    const pickedRevisionMode = await pickRevisionsMode(context, containerApp);
    // only update it if it's actually different
    if (containerApp.revisionsMode !== pickedRevisionMode) {
        const updating = localize('updatingRevision', 'Updating revision mode of "{0}" to "{1}"...', containerApp.name, pickedRevisionMode);
        ext.outputChannel.appendLog(updating);

        await window.withProgress({ location: ProgressLocation.Notification, title: updating }, async (): Promise<void> => {
            await updateContainerApp(context, subscription, containerApp, { configuration: { activeRevisionsMode: pickedRevisionMode } });
            ext.state.notifyChildrenChanged(containerApp.managedEnvironmentId);
        });

        const updated = localize('updatedRevision', 'Updated revision mode of "{0}" to "{1}".', containerApp.name, pickedRevisionMode);
        void window.showInformationMessage(updated);
        ext.outputChannel.appendLog(updated);
    }
}

function getRevisionsModePicks(containerApp: ContainerAppModel): IAzureQuickPickItem<KnownActiveRevisionsMode>[] {

    function appendCurrent(description: string, revisionsMode: KnownActiveRevisionsMode): string {
        return revisionsMode === containerApp.revisionsMode ? `${description} (current)` : description;
    }

    return [
        {
            label: localize('multiple', 'Multiple'),
            description: appendCurrent(localize('multipleDesc', 'Several revisions active simultaneously'), KnownActiveRevisionsMode.Multiple),
            data: KnownActiveRevisionsMode.Multiple,
        },
        {
            label: localize('single', 'Single'),
            description: appendCurrent(localize('singleDesc', 'One active revision at a time'), KnownActiveRevisionsMode.Single),
            data: KnownActiveRevisionsMode.Single,
        },
    ];
}

async function pickRevisionsMode(context: IActionContext, containerApp: ContainerAppModel): Promise<KnownActiveRevisionsMode> {
    const placeHolder = localize('chooseRevision', 'Choose revision mode');
    const result = await context.ui.showQuickPick(getRevisionsModePicks(containerApp), {
        placeHolder,
        suppressPersistence: true,
    });
    return result.data;
}
