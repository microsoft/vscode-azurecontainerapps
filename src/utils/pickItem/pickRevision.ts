/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode } from "@azure/arm-appcontainers";
import { AzureWizardPromptStep, ContextValueQuickPickStep, IActionContext, QuickPickWizardContext, ResourceGroupsItem, runQuickPickWizard } from "@microsoft/vscode-azext-utils";
import * as vscode from 'vscode';
import { ext } from "../../extensionVariables";
import { ContainerAppItem } from "../../tree/ContainerAppItem";
import { RevisionItem } from "../../tree/revisionManagement/RevisionItem";
import { RevisionsItem } from "../../tree/revisionManagement/RevisionsItem";
import { localize } from "../localize";
import { PickItemOptions, pickContainerApp } from "./pickContainerApp";

interface RevisionPickItemOptions extends PickItemOptions {
    // Automatically select a RevisionItem without re-prompting the user
    selectByRevisionName?: string;
}

function getPickRevisionStep(tdp: vscode.TreeDataProvider<unknown>): AzureWizardPromptStep<QuickPickWizardContext> {
    return new ContextValueQuickPickStep(tdp, {
        contextValueFilter: { include: RevisionItem.contextValueRegExp },
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

/**
 * Without re-prompting, automatically selects a RevisionItem matching the known 'revisionName'
 */
async function selectWithoutPrompt(startingNode: ContainerAppItem | RevisionsItem, revisionName: string): Promise<RevisionItem> {
    let currentNode = startingNode;

    // If we are at the ContainerAppItem level in multiple revisions mode, we need to drill one level deeper before we can search for the RevisionItem
    if (currentNode instanceof ContainerAppItem && currentNode.containerApp.revisionsMode === KnownActiveRevisionsMode.Multiple) {
        for (const child of await currentNode.getChildren()) {
            if (child instanceof RevisionsItem) {
                currentNode = child;
                break;
            }
        }

        if (!(currentNode instanceof RevisionsItem)) {
            throw new Error(localize('noRevisionManagementFound', 'No revision management found.'));
        }
    }

    // Search for a matching RevisionItem
    for (const child of await currentNode.getChildren()) {
        if (child instanceof RevisionItem && child.revision.name === revisionName) {
            currentNode = child;
            break;
        }
    }

    if (!(currentNode instanceof RevisionItem)) {
        throw new Error(localize('noMatchingRevisionFound', 'No matching revision found.'));
    }

    return currentNode;
}

export async function revisionExperience(context: IActionContext, tdp: vscode.TreeDataProvider<ResourceGroupsItem>, startingNode?: ContainerAppItem | RevisionsItem, options?: RevisionPickItemOptions): Promise<RevisionItem> {
    startingNode ??= await pickContainerApp(context);

    if (options?.selectByRevisionName) {
        return await selectWithoutPrompt(startingNode, options.selectByRevisionName);
    }

    const promptSteps: AzureWizardPromptStep<QuickPickWizardContext>[] = [];
    if (startingNode.containerApp.revisionsMode === KnownActiveRevisionsMode.Multiple) {
        promptSteps.push(getPickRevisionsStep(tdp));
    }

    promptSteps.push(getPickRevisionStep(tdp));

    return await runQuickPickWizard(context, {
        promptSteps,
        title: options?.title,
    }, startingNode);
}

export async function pickRevision(context: IActionContext, startingNode?: ContainerAppItem | RevisionsItem, options?: RevisionPickItemOptions): Promise<RevisionItem> {
    return await revisionExperience(context, ext.rgApiV2.resources.azureResourceTreeDataProvider, startingNode, options);
}
