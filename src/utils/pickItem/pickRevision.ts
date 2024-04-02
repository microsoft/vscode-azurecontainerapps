/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode } from "@azure/arm-appcontainers";
import { ContextValueQuickPickStep, NoResourceFoundError, runQuickPickWizard, type AzureWizardPromptStep, type IActionContext, type QuickPickWizardContext } from "@microsoft/vscode-azext-utils";
import { ext } from "../../extensionVariables";
import { ContainerAppItem } from "../../tree/ContainerAppItem";
import { RevisionDraftItem } from "../../tree/revisionManagement/RevisionDraftItem";
import { RevisionItem } from "../../tree/revisionManagement/RevisionItem";
import { RevisionsItem } from "../../tree/revisionManagement/RevisionsItem";
import { localize } from "../localize";
import { type PickItemOptions, type RevisionPickItemOptions } from "./PickItemOptions";
import { pickContainerApp } from "./pickContainerApp";

export function getPickRevisionDraftStep(): AzureWizardPromptStep<QuickPickWizardContext> {
    return new ContextValueQuickPickStep(ext.rgApiV2.resources.azureResourceTreeDataProvider, {
        contextValueFilter: { include: RevisionDraftItem.contextValueRegExp },
        skipIfOne: true,
    });
}

export function getPickRevisionStep(revisionName?: string | RegExp): AzureWizardPromptStep<QuickPickWizardContext> {
    let revisionFilter: RegExp | undefined;
    if (revisionName) {
        revisionFilter = revisionName instanceof RegExp ? revisionName : new RegExp(revisionName);
    } else {
        revisionFilter = RevisionItem.contextValueRegExp;
    }

    return new ContextValueQuickPickStep(ext.rgApiV2.resources.azureResourceTreeDataProvider, {
        contextValueFilter: { include: revisionFilter },
        skipIfOne: true,
    }, {
        placeHolder: localize('selectRevisionItem', 'Select a revision'),
        noPicksMessage: localize('noRevisions', 'Selected container app has no revisions'),
    });
}

export function getPickRevisionsStep(): AzureWizardPromptStep<QuickPickWizardContext> {
    return new ContextValueQuickPickStep(ext.rgApiV2.resources.azureResourceTreeDataProvider, {
        contextValueFilter: { include: RevisionsItem.contextValueRegExp },
        skipIfOne: true,
    });
}

export async function pickRevision(context: IActionContext, startingNode?: ContainerAppItem | RevisionsItem, options?: RevisionPickItemOptions): Promise<RevisionItem> {
    startingNode ??= await pickContainerApp(context);

    if (startingNode.containerApp.revisionsMode === KnownActiveRevisionsMode.Single) {
        throw new NoResourceFoundError(Object.assign(context, { noItemFoundErrorMessage: localize('singleRevisionModeError', 'Revision items do not exist in single revision mode.') }));
    }

    const promptSteps: AzureWizardPromptStep<QuickPickWizardContext>[] = [];

    if (ContainerAppItem.isContainerAppItem(startingNode)) {
        promptSteps.push(getPickRevisionsStep());
    }

    promptSteps.push(getPickRevisionStep(options?.selectByRevisionName));

    return await runQuickPickWizard(context, {
        promptSteps,
        title: options?.title,
        showLoadingPrompt: options?.showLoadingPrompt
    }, startingNode);
}

export async function pickRevisionDraft(context: IActionContext, containerAppItem?: ContainerAppItem, options?: PickItemOptions): Promise<RevisionDraftItem> {
    containerAppItem ??= await pickContainerApp(context);

    if (containerAppItem.containerApp.revisionsMode === KnownActiveRevisionsMode.Single) {
        throw new NoResourceFoundError(Object.assign(context, { noItemFoundErrorMessage: localize('singleRevisionModeError', 'Revision draft items do not exist in single revision mode.') }));
    }

    if (!ext.revisionDraftFileSystem.doesContainerAppsItemHaveRevisionDraft(containerAppItem)) {
        throw new NoResourceFoundError(Object.assign(context, { noItemFoundErrorMessage: localize('noRevisionDraft', 'Selected container app has no active revision draft.') }));
    }

    return await runQuickPickWizard(context, {
        promptSteps: [getPickRevisionsStep(), getPickRevisionDraftStep()],
        title: options?.title,
        showLoadingPrompt: options?.showLoadingPrompt
    }, containerAppItem);
}
