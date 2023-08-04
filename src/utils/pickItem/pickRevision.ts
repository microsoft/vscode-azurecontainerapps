/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode } from "@azure/arm-appcontainers";
import { AzureWizardPromptStep, ContextValueQuickPickStep, IActionContext, NoResourceFoundError, QuickPickWizardContext, runQuickPickWizard } from "@microsoft/vscode-azext-utils";
import { ext } from "../../extensionVariables";
import { ContainerAppItem } from "../../tree/ContainerAppItem";
import { RevisionDraftItem } from "../../tree/revisionManagement/RevisionDraftItem";
import { RevisionItem } from "../../tree/revisionManagement/RevisionItem";
import { RevisionsItem } from "../../tree/revisionManagement/RevisionsItem";
import { localize } from "../localize";
import type { RevisionPickItemOptions } from "./PickItemOptions";
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

    if (startingNode instanceof ContainerAppItem) {
        promptSteps.push(getPickRevisionsStep());
    }

    promptSteps.push(getPickRevisionStep(options?.selectByRevisionName));

    return await runQuickPickWizard(context, {
        promptSteps,
        title: options?.title,
    }, startingNode);
}
