/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode } from "@azure/arm-appcontainers";
import { AzureWizardPromptStep, ContextValueQuickPickStep, IActionContext, QuickPickWizardContext, runQuickPickWizard } from "@microsoft/vscode-azext-utils";
import { ext } from "../../extensionVariables";
import { ContainerAppItem } from "../../tree/ContainerAppItem";
import { ScaleItem } from "../../tree/scaling/ScaleItem";
import { ScaleRuleGroupItem } from "../../tree/scaling/ScaleRuleGroupItem";
import { PickItemOptions } from "./PickItemOptions";
import { pickContainerApp } from "./pickContainerApp";
import { getPickRevisionStep, getPickRevisionsStep } from "./pickRevision";

function getPickScaleStep(): AzureWizardPromptStep<QuickPickWizardContext> {
    return new ContextValueQuickPickStep(ext.rgApiV2.resources.azureResourceTreeDataProvider, {
        contextValueFilter: { include: ScaleItem.contextValueRegExp },
        skipIfOne: true,
    });
}

/**
 * Assumes starting from the ContainerAppItem
 */
function getPickScaleSteps(revisionsMode: KnownActiveRevisionsMode): AzureWizardPromptStep<QuickPickWizardContext>[] {
    const promptSteps: AzureWizardPromptStep<QuickPickWizardContext>[] = [];
    if (revisionsMode === KnownActiveRevisionsMode.Multiple) {
        promptSteps.push(getPickRevisionsStep(), getPickRevisionStep());
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

export async function pickScale(context: IActionContext, options?: PickItemOptions): Promise<ScaleItem> {
    const containerAppItem: ContainerAppItem = await pickContainerApp(context);
    return await runQuickPickWizard(context, {
        promptSteps: getPickScaleSteps(containerAppItem.containerApp.revisionsMode),
        title: options?.title,
    }, containerAppItem);
}

export async function pickScaleRuleGroup(context: IActionContext, options?: PickItemOptions): Promise<ScaleRuleGroupItem> {
    const containerAppItem: ContainerAppItem = await pickContainerApp(context);

    const promptSteps: AzureWizardPromptStep<QuickPickWizardContext>[] = [
        ...getPickScaleSteps(containerAppItem.containerApp.revisionsMode),
        getPickScaleRuleGroupStep()
    ];

    return await runQuickPickWizard(context, {
        promptSteps,
        title: options?.title,
    }, containerAppItem);
}
