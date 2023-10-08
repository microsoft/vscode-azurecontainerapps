/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode, type Template } from "@azure/arm-appcontainers";
import { AzureWizardExecuteStep, nonNullValueAndProp } from "@microsoft/vscode-azext-utils";
import type { Progress } from "vscode";
import { ext } from "../../extensionVariables";
import { ContainerAppItem } from "../../tree/ContainerAppItem";
import type { RevisionsItemModel } from "../../tree/revisionManagement/RevisionItem";
import type { IContainerAppContext } from "../IContainerAppContext";

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
    protected updateRevisionDraftWithTemplate(): void {
        ext.revisionDraftFileSystem.updateRevisionDraftWithTemplate(this.baseItem, this.revisionDraftTemplate);
    }

    private initRevisionDraftTemplate(): Template {
        let template: Template | undefined = ext.revisionDraftFileSystem.parseRevisionDraft(this.baseItem);
        if (!template) {
            // Branching path reasoning: https://github.com/microsoft/vscode-azurecontainerapps/blob/main/src/commands/revisionDraft/README.md
            // Make deep copies so we don't accidentally modify the cached values
            if (ContainerAppItem.isContainerAppItem(this.baseItem) || this.baseItem.containerApp.revisionsMode === KnownActiveRevisionsMode.Single) {
                template = JSON.parse(JSON.stringify(nonNullValueAndProp(this.baseItem.containerApp, 'template'))) as Template;
            } else {
                template = JSON.parse(JSON.stringify(nonNullValueAndProp(this.baseItem.revision, 'template'))) as Template;
            }
        }
        return template;
    }
}
