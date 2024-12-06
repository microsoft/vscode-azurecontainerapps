/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { parseAzureResourceId } from "@microsoft/vscode-azext-azureutils";
import { ContextValueQuickPickStep, nonNullProp, runQuickPickWizard, type AzureResourceQuickPickWizardContext, type AzureWizardPromptStep, type IActionContext, type ISubscriptionActionContext, type QuickPickWizardContext } from "@microsoft/vscode-azext-utils";
import { ext } from "../../extensionVariables";
import { ContainerAppItem, type ContainerAppModel } from "../../tree/ContainerAppItem";
import { localize } from "../localize";
import { type PickItemOptions } from "./PickItemOptions";
import { getPickEnvironmentSteps } from "./pickEnvironment";

export function getPickContainerAppStep(containerAppName?: string | RegExp): AzureWizardPromptStep<AzureResourceQuickPickWizardContext> {
    let containerAppFilter: RegExp | undefined;
    if (containerAppName) {
        containerAppFilter = containerAppName instanceof RegExp ? containerAppName : new RegExp(`^${containerAppName}$`);
    } else {
        containerAppFilter = ContainerAppItem.contextValueRegExp;
    }

    return new ContextValueQuickPickStep(ext.rgApiV2.resources.azureResourceTreeDataProvider, {
        contextValueFilter: { include: containerAppFilter },
        skipIfOne: !!containerAppName,
    }, {
        placeHolder: localize('selectContainerApp', 'Select a container app'),
        noPicksMessage: localize('noContainerApps', 'Selected container apps environment has no apps'),
    });
}

/**
 * Get all the steps required to pick a `ContainerAppItem`
 */
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
    context: Partial<ISubscriptionActionContext> & IActionContext,
    containerApp: ContainerAppModel,
    options?: PickItemOptions
): Promise<ContainerAppItem> {
    const environmentName: string = parseAzureResourceId(nonNullProp(containerApp, 'environmentId')).resourceName;

    return await runQuickPickWizard(context, {
        promptSteps: [
            ...getPickEnvironmentSteps(true, context.subscriptionId, environmentName),
            getPickContainerAppStep(containerApp.name)
        ],
        title: options?.title,
        showLoadingPrompt: options?.showLoadingPrompt
    });
}
