/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode, Revision } from "@azure/arm-appcontainers";
import { window } from "vscode";
import { ContainerAppModel } from "../tree/ContainerAppItem";
import { localize } from "./localize";
import { settingUtils } from "./settingUtils";

/**
 * Use to always select the correct parent resource model
 * https://github.com/microsoft/vscode-azurecontainerapps/blob/main/src/commands/revisionDraft/README.md
 */
export function getParentResource(containerApp: ContainerAppModel, revision: Revision): ContainerAppModel | Revision {
    return containerApp.revisionsMode === KnownActiveRevisionsMode.Single ? containerApp : revision;
}

export async function showRevisionDraftInformationPopup(): Promise<void> {
    if (!await settingUtils.getGlobalSetting('showDraftCommandInformationPopup')) {
        return;
    }

    const moreInfo: string = localize('moreInfo', 'More info');
    const dontShowAgain: string = localize('dontShowAgain', 'Don\'t show again');

    const message: string = localize('revisionDraftInfo', 'You just executed a draft command! Draft commands make local changes which can later be deployed by running `Deploy Changes...`.');

    const buttonMessages: string[] = [moreInfo, dontShowAgain];
    void window.showInformationMessage(message, ...buttonMessages).then(async (result: string | undefined) => {
        if (result === moreInfo) {
            //
        } else if (result === dontShowAgain) {
            await settingUtils.updateGlobalSetting('showDraftCommandInformationPopup', false);
        }
    });
}
