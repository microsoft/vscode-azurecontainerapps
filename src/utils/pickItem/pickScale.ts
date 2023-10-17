/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode } from "@azure/arm-appcontainers";
import { AzureWizardPromptStep, ContextValueQuickPickStep, IActionContext, QuickPickWizardContext, runQuickPickWizard } from "@microsoft/vscode-azext-utils";
import { ext } from "../../extensionVariables";
import type { ContainerAppItem } from "../../tree/ContainerAppItem";
import { ScaleItem } from "../../tree/scaling/ScaleItem";
import { ScaleRuleGroupItem } from "../../tree/scaling/ScaleRuleGroupItem";
import { ScaleRuleItem } from "../../tree/scaling/ScaleRuleItem";
import { localize } from "../localize";
import type { RevisionDraftPickItemOptions } from "./PickItemOptions";
import { pickContainerApp } from "./pickContainerApp";
import { getPickRevisionDraftStep, getPickRevisionStep, getPickRevisionsStep } from "./pickRevision";

function getPickScaleStep(): AzureWizardPromptStep<QuickPickWizardContext> {
    return new ContextValueQuickPickStep(ext.rgApiV2.resources.azureResourceTreeDataProvider, {
        contextValueFilter: { include: ScaleItem.contextValueRegExp },
        skipIfOne: true,
    });
}

/**
 * Assumes starting from the ContainerAppItem
 */
function getPickScaleSteps(containerAppItem: ContainerAppItem, options?: RevisionDraftPickItemOptions): AzureWizardPromptStep<QuickPickWizardContext>[] {
    const promptSteps: AzureWizardPromptStep<QuickPickWizardContext>[] = [];
    if (containerAppItem.containerApp.revisionsMode === KnownActiveRevisionsMode.Multiple) {
        promptSteps.push(getPickRevisionsStep());

        if (options?.autoSelectDraft && ext.revisionDraftFileSystem.doesContainerAppsItemHaveRevisionDraft(containerAppItem)) {
            promptSteps.push(getPickRevisionDraftStep());
        } else {
            promptSteps.push(getPickRevisionStep());
        }
    }

    promptSteps.push(getPickScaleStep());
    return promptSteps;
}

function getPickScaleRuleGroupStep(): AzureWizardPromptStep<QuickPickWizardContext> {
    return new ContextValueQuickPickStep(ext.rgApiV2.resources.azureResourceTreeDataProvider, {
        contextValueFilter: { include: ScaleRuleGroupItem.contextValue },
        skipIfOne: true,
    });
}

function getPickScaleRuleStep(): AzureWizardPromptStep<QuickPickWizardContext> {
    return new ContextValueQuickPickStep(ext.rgApiV2.resources.azureResourceTreeDataProvider, {
        contextValueFilter: { include: ScaleRuleItem.contextValue },
        skipIfOne: false,
    }, {
        placeHolder: localize('selectScaleRuleItem', 'Select a scale rule'),
        noPicksMessage: localize('noScaleRules', 'Selected item has no scale rules'),
    });
}

export async function pickScale(context: IActionContext, options?: RevisionDraftPickItemOptions): Promise<ScaleItem> {
    const containerAppItem: ContainerAppItem = await pickContainerApp(context);
    return await runQuickPickWizard(context, {
        promptSteps: getPickScaleSteps(containerAppItem, { autoSelectDraft: options?.autoSelectDraft }),
        title: options?.title,
    }, containerAppItem);
}

export async function pickScaleRuleGroup(context: IActionContext, options?: RevisionDraftPickItemOptions): Promise<ScaleRuleGroupItem> {
    const containerAppItem: ContainerAppItem = await pickContainerApp(context);

    const promptSteps: AzureWizardPromptStep<QuickPickWizardContext>[] = [
        ...getPickScaleSteps(containerAppItem, { autoSelectDraft: options?.autoSelectDraft }),
        getPickScaleRuleGroupStep()
    ];

    return await runQuickPickWizard(context, {
        promptSteps,
        title: options?.title,
        showLoadingPrompt: options?.showLoadingPrompt
    }, containerAppItem);
}

export async function pickScaleRule(context: IActionContext, options?: RevisionDraftPickItemOptions): Promise<ScaleRuleItem> {
    const containerAppItem: ContainerAppItem = await pickContainerApp(context);

    const promptSteps: AzureWizardPromptStep<QuickPickWizardContext>[] = [
        ...getPickScaleSteps(containerAppItem, { autoSelectDraft: options?.autoSelectDraft }),
        getPickScaleRuleGroupStep(),
        getPickScaleRuleStep()
    ];

    return await runQuickPickWizard(context, {
        promptSteps,
        title: options?.title,
        showLoadingPrompt: options?.showLoadingPrompt
    }, containerAppItem);
}
