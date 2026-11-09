/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { parseAzureResourceId } from "@microsoft/vscode-azext-azureutils";
import { ContextValueQuickPickStep, nonNullProp, runQuickPickWizard, type AzureResourceQuickPickWizardContext, type AzureWizardPromptStep, type ContextValueFilterQuickPickOptions, type IActionContext, type ISubscriptionActionContext, type PickFilter, type QuickPickWizardContext } from "@microsoft/vscode-azext-utils";
import { ext } from "../../extensionVariables";
import { ContainerAppItem, type ContainerAppModel } from "../../tree/ContainerAppItem";
import { localize } from "../localize";
import { type ContainerAppPickItemOptions, type PickItemOptions } from "./PickItemOptions";
import { getPickEnvironmentSteps } from "./pickEnvironment";

export function getPickContainerAppStep(containerAppName?: string | RegExp, options?: ContainerAppPickItemOptions): AzureWizardPromptStep<AzureResourceQuickPickWizardContext> {
    let containerAppFilter: RegExp | undefined;
    if (containerAppName) {
        containerAppFilter = containerAppName instanceof RegExp ? containerAppName : new RegExp(`^${containerAppName}$`);
    } else {
        containerAppFilter = ContainerAppItem.contextValueRegExp;
    }

    return new ContainerAppQuickPickStep(containerAppFilter, !!containerAppName, options);
}

class ContainerAppQuickPickStep extends ContextValueQuickPickStep<AzureResourceQuickPickWizardContext, ContextValueFilterQuickPickOptions> {
    declare protected readonly pickFilter: PickFilter;

    constructor(containerAppFilter: RegExp, skipIfOne: boolean, options?: ContainerAppPickItemOptions) {
        super(ext.rgApiV2.resources.azureResourceTreeDataProvider, {
            contextValueFilter: { include: containerAppFilter },
            skipIfOne,
        }, {
            placeHolder: localize('selectContainerApp', 'Select a container app'),
            noPicksMessage: options?.noPicksMessage ?? localize('noContainerApps', 'Selected container apps environment has no apps'),
        });

        const filter = options?.filter;
        if (filter) {
            const pickFilter = this.pickFilter;
            this.pickFilter = {
                isFinalPick: (treeItem, element) => pickFilter.isFinalPick(treeItem, element) && filter(treeItem, element),
                // The shared picker falls back to expandable ancestors when no final picks remain.
                isAncestorPick: (treeItem, element) => pickFilter.isAncestorPick(treeItem, element) && filter(treeItem, element),
            };
        }
    }
}

/**
 * Get all the steps required to pick a `ContainerAppItem`
 */
export function getPickContainerAppSteps(options?: ContainerAppPickItemOptions): AzureWizardPromptStep<AzureResourceQuickPickWizardContext>[] {
    return [
        ...getPickEnvironmentSteps(),
        getPickContainerAppStep(undefined, options)
    ];
}

export async function pickContainerApp(context: IActionContext, options?: ContainerAppPickItemOptions): Promise<ContainerAppItem> {
    const promptSteps: AzureWizardPromptStep<QuickPickWizardContext>[] = [
        ...getPickContainerAppSteps(options)
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
