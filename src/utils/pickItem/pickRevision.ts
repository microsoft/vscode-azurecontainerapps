/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, ContextValueQuickPickStep, IActionContext, QuickPickWizardContext, runQuickPickWizard } from "@microsoft/vscode-azext-utils";
import type { ResourceGroupsTreeDataProvider } from "@microsoft/vscode-azureresources-api";
import * as vscode from 'vscode';
import { ext } from "../../extensionVariables";
import { ContainerAppItem } from "../../tree/ContainerAppItem";
import { RevisionItem } from "../../tree/revisionManagement/RevisionItem";
import { RevisionsItem } from "../../tree/revisionManagement/RevisionsItem";
import { localize } from "../localize";
import type { RevisionPickItemOptions } from "./PickItemOptions";
import { pickContainerApp } from "./pickContainerApp";

function getPickRevisionStep(tdp: vscode.TreeDataProvider<unknown>, revisionName?: string | RegExp): AzureWizardPromptStep<QuickPickWizardContext> {
    let revisionFilter: RegExp | undefined;
    if (revisionName) {
        revisionFilter = revisionName instanceof RegExp ? revisionName : new RegExp(revisionName);
    } else {
        revisionFilter = RevisionItem.contextValueRegExp;
    }

    return new ContextValueQuickPickStep(tdp, {
        contextValueFilter: { include: revisionFilter },
        skipIfOne: true,
    });
}

function getPickRevisionsStep(tdp: vscode.TreeDataProvider<unknown>): AzureWizardPromptStep<QuickPickWizardContext> {
    return new ContextValueQuickPickStep(tdp, {
        contextValueFilter: { include: RevisionsItem.contextValueRegExp },
        skipIfOne: true,
    }, {
        placeHolder: localize('selectRevisionItem', 'Select a revision')
    });
}

export async function pickRevision(context: IActionContext, startingNode?: ContainerAppItem | RevisionsItem, options?: RevisionPickItemOptions): Promise<RevisionItem> {
    startingNode ??= await pickContainerApp(context);

    const tdp: ResourceGroupsTreeDataProvider = ext.rgApiV2.resources.azureResourceTreeDataProvider;
    const promptSteps: AzureWizardPromptStep<QuickPickWizardContext>[] = [];

    if (startingNode instanceof ContainerAppItem) {
        promptSteps.push(getPickRevisionsStep(tdp));
    }

    promptSteps.push(getPickRevisionStep(tdp, options?.selectByRevisionName));

    return await runQuickPickWizard(context, {
        promptSteps,
        title: options?.title,
    }, startingNode);
}
