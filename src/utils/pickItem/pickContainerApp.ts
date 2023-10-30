/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { parseAzureResourceId } from "@microsoft/vscode-azext-azureutils";
import { AzureResourceQuickPickWizardContext, AzureWizardPromptStep, ContextValueQuickPickStep, IActionContext, QuickPickWizardContext, nonNullProp, runQuickPickWizard } from "@microsoft/vscode-azext-utils";
import { ext } from "../../extensionVariables";
import { ContainerAppItem, ContainerAppModel } from "../../tree/ContainerAppItem";
import { localize } from "../localize";
import type { PickItemOptions } from "./PickItemOptions";
import { getPickEnvironmentSteps } from "./pickEnvironment";

export function getPickContainerAppStep(containerAppName?: string | RegExp): AzureWizardPromptStep<AzureResourceQuickPickWizardContext> {
    let containerAppFilter: RegExp | undefined;
    if (containerAppName) {
        containerAppFilter = containerAppName instanceof RegExp ? containerAppName : new RegExp(containerAppName);
    } else {
        containerAppFilter = ContainerAppItem.contextValueRegExp;
    }

    return new ContextValueQuickPickStep(ext.rgApiV2.resources.azureResourceTreeDataProvider, {
        contextValueFilter: { include: containerAppFilter },
        skipIfOne: false,
    }, {
        placeHolder: localize('selectContainerApp', 'Select a container app'),
        noPicksMessage: localize('noContainerApps', 'Selected container apps environment has no apps'),
    });
}

export function getPickContainerAppSteps(): AzureWizardPromptStep<AzureResourceQuickPickWizardContext>[] {
    return [
        ...getPickEnvironmentSteps(),
        getPickContainerAppStep()
    ];
}

export async function pickContainerApp(context: IActionContext, options?: PickItemOptions): Promise<ContainerAppItem> {
    const promptSteps: AzureWizardPromptStep<QuickPickWizardContext>[] = [
        ...getPickContainerAppSteps()
    ];

    return await runQuickPickWizard(context, {
        promptSteps,
        title: options?.title,
        showLoadingPrompt: options?.showLoadingPrompt
    });
}

export async function pickContainerAppWithoutPrompt(
    context: IActionContext,
    containerApp: ContainerAppModel,
    options?: PickItemOptions
): Promise<ContainerAppItem> {
    const environmentName: string = parseAzureResourceId(nonNullProp(containerApp, 'environmentId')).resourceName;

    return await runQuickPickWizard(context, {
        promptSteps: [
            ...getPickEnvironmentSteps(true /** skipIfOne */, environmentName),
            getPickContainerAppStep(containerApp.name)
        ],
        title: options?.title,
        showLoadingPrompt: options?.showLoadingPrompt
    });
}
