/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode } from "@azure/arm-appcontainers";
import { AzureWizardPromptStep, type AzureResourceQuickPickWizardContext, type IWizardOptions, type QuickPickWizardContext } from "@microsoft/vscode-azext-utils";
import { type ResourceModelBase } from "@microsoft/vscode-azureresources-api";
import { ext } from "../../extensionVariables";
import { ContainerAppItem } from "../../tree/ContainerAppItem";
import { localize } from "../localize";
import { type RevisionDraftPickItemOptions } from "./PickItemOptions";
import { getPickRevisionDraftStep, getPickRevisionsStep, getPickRevisionStep } from "./pickRevision";

/**
 * Use to add pick steps that automatically select down to the appropriate parent resource (`ContainerAppItem`, `RevisionItem`, or `RevisionDraftItem`)
 * given that the last node picked was a `ContainerAppItem`.
 */
export class ParentResourceItemPickSteps<T extends AzureResourceQuickPickWizardContext> extends AzureWizardPromptStep<T> {
    constructor(readonly options?: RevisionDraftPickItemOptions) {
        super();
    }

    public async prompt(): Promise<void> {
        // Nothing to prompt, just need to use the subwizard
    }

    public shouldPrompt(): boolean {
        return false;
    }

    public async getSubWizard(context: T): Promise<IWizardOptions<T> | undefined> {
        const lastNode: unknown = context.pickedNodes.at(-1);
        const containerAppItem: unknown = (lastNode as { branchItem?: ResourceModelBase })?.branchItem ?? lastNode;

        if (!ContainerAppItem.isContainerAppItem(containerAppItem)) {
            throw new Error(localize('expectedContainerAppItem', 'Internal error: Expected last picked item to be a "ContainerAppItem".'));
        }

        const promptSteps: AzureWizardPromptStep<QuickPickWizardContext>[] = [];
        if (containerAppItem.containerApp.revisionsMode === KnownActiveRevisionsMode.Multiple) {
            promptSteps.push(getPickRevisionsStep());

            if (this.options?.autoSelectDraft && ext.revisionDraftFileSystem.doesContainerAppsItemHaveRevisionDraft(containerAppItem)) {
                promptSteps.push(getPickRevisionDraftStep());
            } else {
                promptSteps.push(getPickRevisionStep());
            }
        }

        return { promptSteps };
    }
}
