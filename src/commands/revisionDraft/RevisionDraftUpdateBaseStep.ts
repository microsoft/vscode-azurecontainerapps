/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode, type Template } from "@azure/arm-appcontainers";
import { AzureWizardExecuteStep, callWithTelemetryAndErrorHandling, nonNullValueAndProp, type IActionContext } from "@microsoft/vscode-azext-utils";
import { type Progress } from "vscode";
import { ext } from "../../extensionVariables";
import { ContainerAppItem } from "../../tree/ContainerAppItem";
import { RevisionDraftItem } from "../../tree/revisionManagement/RevisionDraftItem";
import { type RevisionsItemModel } from "../../tree/revisionManagement/RevisionItem";
import { getParentResourceFromItem } from "../../utils/revisionDraftUtils";
import { deployRevisionDraft } from "./deployRevisionDraft/deployRevisionDraft";
import { type RevisionDraftContext } from "./RevisionDraftContext";

export abstract class RevisionDraftUpdateBaseStep<T extends RevisionDraftContext> extends AzureWizardExecuteStep<T> {
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

    private initRevisionDraftTemplate(): Template {
        let template: Template | undefined = ext.revisionDraftFileSystem.parseRevisionDraft(this.baseItem);
        if (!template) {
            // Make deep copies so we don't accidentally modify the cached values
            template = JSON.parse(JSON.stringify(nonNullValueAndProp(getParentResourceFromItem(this.baseItem), 'template'))) as Template;
        }
        return template;
    }

    /**
     * Call this method to upload `revisionDraftTemplate` changes to the container app revision draft
     */
    protected async updateRevisionDraftWithTemplate(context: T): Promise<void> {
        ext.revisionDraftFileSystem.updateRevisionDraftWithTemplate(this.baseItem, this.revisionDraftTemplate);

        if (context.shouldDeployRevisionDraft) {
            void this.deployRevisionDraftTemplate(context);
        }
    }

    /**
     * Directly deploys the revision draft without picking from the tree.
     * Constructs items from `baseItem` data to avoid a race condition where
     * concurrent tree access (from `revealResource`) can cancel the subscription
     * loading and cause "No subscriptions found" errors.
     */
    private async deployRevisionDraftTemplate(_context: T): Promise<void> {
        let item: ContainerAppItem | RevisionDraftItem;

        if (this.baseItem.containerApp.revisionsMode === KnownActiveRevisionsMode.Single) {
            item = new ContainerAppItem(this.baseItem.subscription, this.baseItem.containerApp);
        } else {
            const revisionsItem = this.baseItem as RevisionsItemModel;
            item = new RevisionDraftItem(this.baseItem.subscription, this.baseItem.containerApp, revisionsItem.revision);
        }

        // Pass the deploy command a fresh context
        await callWithTelemetryAndErrorHandling('revisionDraftUpdateBaseStep.deploy',
            async (context: IActionContext) => await deployRevisionDraft(context, item));
    }
}
