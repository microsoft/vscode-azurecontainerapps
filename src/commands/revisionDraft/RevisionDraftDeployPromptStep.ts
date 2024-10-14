/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, type IAzureQuickPickItem } from "@microsoft/vscode-azext-utils";
import { showDraftCommandDeployPopupSetting } from "../../constants";
import { localize } from "../../utils/localize";
import { settingUtils } from "../../utils/settingUtils";
import { type RevisionDraftContext } from "./RevisionDraftContext";

export class RevisionDraftDeployPromptStep<T extends RevisionDraftContext> extends AzureWizardPromptStep<T> {
    public configureBeforePrompt(context: T): void | Promise<void> {
        if (!settingUtils.getGlobalSetting(showDraftCommandDeployPopupSetting)) {
            context.shouldDeployRevisionDraft = false;
        }
    }

    public async prompt(context: T): Promise<void> {
        const yes: string = localize('yes', 'Yes');
        const no: string = localize('no', 'No');
        const dontAskAgain: string = localize('dontAskAgain', 'No, don\'t ask again');
        const picks: IAzureQuickPickItem<string>[] = [
            { label: yes, data: yes },
            { label: no, data: no },
            { label: dontAskAgain, data: dontAskAgain },
        ];

        const result: string = (await context.ui.showQuickPick(picks, {
            placeHolder: localize('deployImmediately', 'Deploy changes immediately?'),
            suppressPersistence: true,
        })).data;

        if (result === yes) {
            context.shouldDeployRevisionDraft = true;
        } else {
            context.shouldDeployRevisionDraft = false;
            if (result === dontAskAgain) {
                await settingUtils.updateGlobalSetting(showDraftCommandDeployPopupSetting, false);
            }
        }
    }

    public shouldPrompt(context: RevisionDraftContext): boolean {
        return context.shouldDeployRevisionDraft === undefined;
    }
}
