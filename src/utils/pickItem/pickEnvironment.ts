/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ContextValueQuickPickStep, QuickPickAzureSubscriptionStep, QuickPickGroupStep, runQuickPickWizard, type AzureResourceQuickPickWizardContext, type AzureWizardPromptStep, type ContextValueFilterQuickPickOptions, type IActionContext, type PickFilter, type QuickPickWizardContext } from "@microsoft/vscode-azext-utils";
import { AzExtResourceType, type ResourceGroupsTreeDataProvider } from "@microsoft/vscode-azureresources-api";
import { ext } from "../../extensionVariables";
import { ManagedEnvironmentItem } from "../../tree/ManagedEnvironmentItem";
import { localize } from "../localize";
import { type FilteredPickItemOptions } from "./PickItemOptions";

export function getPickEnvironmentSteps(skipIfOne: boolean = false, subscriptionId?: string, environmentName?: string | RegExp, options?: FilteredPickItemOptions): AzureWizardPromptStep<AzureResourceQuickPickWizardContext>[] {
    const tdp: ResourceGroupsTreeDataProvider = ext.rgApiV2.resources.azureResourceTreeDataProvider;
    const types = [AzExtResourceType.ContainerAppsEnvironment];

    let environmentFilter: RegExp | undefined;
    if (environmentName) {
        environmentFilter = environmentName instanceof RegExp ? environmentName : new RegExp(`^${environmentName}$`);
    } else {
        environmentFilter = ManagedEnvironmentItem.contextValueRegExp;
    }

    return [
        new QuickPickAzureSubscriptionStep(tdp, { selectBySubscriptionId: subscriptionId }),
        new QuickPickGroupStep(tdp, {
            groupType: types
        }),
        new EnvironmentQuickPickStep(environmentFilter, skipIfOne, options)
    ];
}

class EnvironmentQuickPickStep extends ContextValueQuickPickStep<AzureResourceQuickPickWizardContext, ContextValueFilterQuickPickOptions> {
    declare protected readonly pickFilter: PickFilter;

    constructor(environmentFilter: RegExp, skipIfOne: boolean, options?: FilteredPickItemOptions) {
        super(ext.rgApiV2.resources.azureResourceTreeDataProvider, {
            contextValueFilter: { include: environmentFilter },
            skipIfOne
        }, {
            placeHolder: localize('selectContainerAppsEnvironment', 'Select a container apps environment'),
            noPicksMessage: options?.noPicksMessage ?? localize('noContainerAppsEnvironment', 'Current subscription has no container apps environments'),
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

export async function pickEnvironment(context: IActionContext, options?: FilteredPickItemOptions): Promise<ManagedEnvironmentItem> {
    const promptSteps: AzureWizardPromptStep<QuickPickWizardContext>[] = [
        ...getPickEnvironmentSteps(false, undefined, undefined, options)
    ];

    return await runQuickPickWizard(context, {
        promptSteps,
        title: options?.title,
        showLoadingPrompt: options?.showLoadingPrompt
    });
}
