/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, ContextValueQuickPickStep, IActionContext, QuickPickWizardContext, ResourceGroupsItem, runQuickPickWizard } from "@microsoft/vscode-azext-utils";
import * as vscode from 'vscode';
import { ext } from "../extensionVariables";
import { ContainerAppItem } from "../tree/ContainerAppItem";
import { RevisionItem } from "../tree/revisionManagement/RevisionItem";
import { RevisionsItem } from "../tree/revisionManagement/RevisionsItem";
import { localize } from "./localize";
import { PickItemOptions, pickContainerApp } from "./pickContainerApp";

interface RevisionPickItemOptions extends PickItemOptions {
    // Automatically select a RevisionItem without re-prompting the user
    selectByRevisionName?: string;
}

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

export function getPickRevisionsStep(tdp: vscode.TreeDataProvider<unknown>): AzureWizardPromptStep<QuickPickWizardContext> {
    return new ContextValueQuickPickStep(tdp,
        {
            contextValueFilter: { include: RevisionsItem.contextValueRegExp },
            skipIfOne: true,
        },
        {
            placeHolder: localize('selectRevisionItem', 'Select a revision item')
        });
}

export async function revisionItemExperience(context: IActionContext, tdp: vscode.TreeDataProvider<ResourceGroupsItem>, startingNode?: ContainerAppItem | RevisionsItem, options?: RevisionPickItemOptions): Promise<RevisionItem> {
    startingNode ??= await pickContainerApp(context);

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

export async function pickRevisionItem(context: IActionContext, startingNode?: ContainerAppItem | RevisionsItem, options?: RevisionPickItemOptions): Promise<RevisionItem> {
    return await revisionItemExperience(context, ext.rgApiV2.resources.azureResourceTreeDataProvider, startingNode, options);
}
