/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode, Revision } from "@azure/arm-appcontainers";
import { IActionContext } from "@microsoft/vscode-azext-utils";
import { ProgressLocation, window } from "vscode";
import { deployRevisionDraft } from "../commands/revisionDraft/deployRevisionDraft/deployRevisionDraft";
import { ContainerAppItem, ContainerAppModel } from "../tree/ContainerAppItem";
import { RevisionDraftItem } from "../tree/revisionManagement/RevisionDraftItem";
import type { RevisionsItemModel } from "../tree/revisionManagement/RevisionItem";
import { localize } from "./localize";
import { pickContainerAppWithoutPrompt } from "./pickItem/pickContainerApp";
import { pickRevisionDraft } from "./pickItem/pickRevision";
import { settingUtils } from "./settingUtils";

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

export async function showRevisionDraftInformationPopup(context: IActionContext, containerApp: ContainerAppModel): Promise<void> {
    if (!await settingUtils.getGlobalSetting('showDraftCommandDeployPopup')) {
        return;
    }

    const yes: string = localize('yes', 'Yes');
    const no: string = localize('no', 'No');
    const dontShowAgain: string = localize('dontShowAgain', 'Don\'t show again');

    const message: string = localize('message', 'Would you like to deploy these changes? Click yes to continue, or click no to keep making changes.');
    const buttonMessages: string[] = [yes, no, dontShowAgain];
    void window.showInformationMessage(message, ...buttonMessages).then(async (result: string | undefined) => {
        if (result === yes) {
            const item: ContainerAppItem | RevisionDraftItem = await window.withProgress({
                location: ProgressLocation.Notification,
                cancellable: false,
                title: localize('preparingForDeployment', 'Preparing for deployment...')
            }, async () => {
                const containerAppItem: ContainerAppItem = await pickContainerAppWithoutPrompt(context, containerApp, { showLoadingPrompt: false });

                if (containerApp.revisionsMode === KnownActiveRevisionsMode.Single) {
                    return containerAppItem;
                } else {
                    return await pickRevisionDraft(context, containerAppItem, { showLoadingPrompt: false });
                }
            });

            await deployRevisionDraft(context, item);
        } else if (result === dontShowAgain) {
            await settingUtils.updateGlobalSetting('showDraftCommandDeployPopup', false);
        } else {
            // Do nothing
        }
    });
}
