/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode, Revision } from "@azure/arm-appcontainers";
import { window } from "vscode";
import { ContainerAppItem, ContainerAppModel } from "../tree/ContainerAppItem";
import { RevisionsItemModel } from "../tree/revisionManagement/RevisionItem";
import { localize } from "./localize";
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

export async function showRevisionDraftInformationPopup(customMessage?: string): Promise<void> {
    if (!await settingUtils.getGlobalSetting('showDraftCommandInformationPopup')) {
        return;
    }

    const moreInfo: string = localize('moreInfo', 'More info');
    const deployChanges: string = localize('deployChanges', 'Deploy changes');
    const dontShowAgain: string = localize('dontShowAgain', 'Don\'t show again');

    const message: string = customMessage ?? localize('revisionDraftInfo', 'You just executed a draft command! Draft commands allow you to bundle local changes together before deploying. Changes can be saved by running `Deploy Changes...`.');

    const buttonMessages: string[] = [moreInfo, deployChanges, dontShowAgain];
    void window.showInformationMessage(message, ...buttonMessages).then(async (result: string | undefined) => {
        if (result === moreInfo) {
            // Todo: Add aka.ms wiki link
        } else if (result === deployChanges) {
            // Add deploy changes code
        } else if (result === dontShowAgain) {
            await settingUtils.updateGlobalSetting('showDraftCommandInformationPopup', false);
        }
    });
}
