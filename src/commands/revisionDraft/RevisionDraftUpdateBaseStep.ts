/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode, type Template } from "@azure/arm-appcontainers";
import { AzureWizardExecuteStep, callWithTelemetryAndErrorHandling, nonNullValueAndProp, type IActionContext } from "@microsoft/vscode-azext-utils";
import { ProgressLocation, window, type Progress } from "vscode";
import { ext } from "../../extensionVariables";
import { type ContainerAppItem } from "../../tree/ContainerAppItem";
import { type RevisionDraftItem } from "../../tree/revisionManagement/RevisionDraftItem";
import { type RevisionsItemModel } from "../../tree/revisionManagement/RevisionItem";
import { localize } from "../../utils/localize";
import { pickContainerAppWithoutPrompt } from "../../utils/pickItem/pickContainerApp";
import { pickRevisionDraft } from "../../utils/pickItem/pickRevision";
import { getParentResourceFromItem } from "../../utils/revisionDraftUtils";
import { settingUtils } from "../../utils/settingUtils";
import { type IContainerAppContext } from "../IContainerAppContext";
import { deployRevisionDraft } from "./deployRevisionDraft/deployRevisionDraft";

export abstract class RevisionDraftUpdateBaseStep<T extends IContainerAppContext> extends AzureWizardExecuteStep<T> {
    /**
     * This property holds the active template revisions used for updating the revision draft
     */
    protected revisionDraftTemplate: Template;

    constructor(readonly baseItem: ContainerAppItem | RevisionsItemModel) {
        super();
        this.revisionDraftTemplate = this.initRevisionDraftTemplate();
    }

    abstract execute(context: T, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void>;
    abstract shouldExecute(context: T): boolean;

    /**
     * Call this method to upload `revisionDraftTemplate` changes to the container app revision draft
     */
    protected async updateRevisionDraftWithTemplate(context: T): Promise<void> {
        ext.revisionDraftFileSystem.updateRevisionDraftWithTemplate(this.baseItem, this.revisionDraftTemplate);
        await this.showRevisionDraftDeployPopup(context);
    }

    private initRevisionDraftTemplate(): Template {
        let template: Template | undefined = ext.revisionDraftFileSystem.parseRevisionDraft(this.baseItem);
        if (!template) {
            // Make deep copies so we don't accidentally modify the cached values
            template = JSON.parse(JSON.stringify(nonNullValueAndProp(getParentResourceFromItem(this.baseItem), 'template'))) as Template;
        }
        return template;
    }

    /**
     * An informational deploy pop-up to show after executing a revision draft command
     */
    private async showRevisionDraftDeployPopup(context: T): Promise<void> {
        if (!await settingUtils.getGlobalSetting('showDraftCommandDeployPopup')) {
            return;
        }

        const yes: string = localize('yes', 'Yes');
        const no: string = localize('no', 'No');
        const dontShowAgain: string = localize('dontShowAgain', 'Don\'t show again');

        const message: string = localize('message', 'Deploy changes now?');
        const buttonMessages: string[] = [yes, no, dontShowAgain];

        void window.showInformationMessage(message, ...buttonMessages).then(async (result: string | undefined) => {
            if (result === yes) {
                const item: ContainerAppItem | RevisionDraftItem = await window.withProgress({
                    location: ProgressLocation.Notification,
                    cancellable: false,
                    title: localize('preparingForDeployment', 'Preparing for deployment...')
                }, async () => {
                    const containerAppItem: ContainerAppItem = await pickContainerAppWithoutPrompt(context, this.baseItem.containerApp, { showLoadingPrompt: false });

                    if (this.baseItem.containerApp.revisionsMode === KnownActiveRevisionsMode.Single) {
                        return containerAppItem;
                    } else {
                        return await pickRevisionDraft(context, containerAppItem, { showLoadingPrompt: false });
                    }
                });

                // Pass the deploy command a fresh context
                await callWithTelemetryAndErrorHandling('revisionDraftUpdateBaseStep.deploy',
                    async (context: IActionContext) => await deployRevisionDraft(context, item));
            } else if (result === dontShowAgain) {
                await settingUtils.updateGlobalSetting('showDraftCommandDeployPopup', false);
            } else {
                // Do nothing
            }
        });
    }
}
