/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ContextValueQuickPickStep, QuickPickAzureSubscriptionStep, QuickPickGroupStep, runQuickPickWizard, type AzureResourceQuickPickWizardContext, type AzureWizardPromptStep, type ContextValueFilterQuickPickOptions, type IActionContext, type QuickPickWizardContext } from "@microsoft/vscode-azext-utils";
import { AzExtResourceType, type ResourceGroupsTreeDataProvider, type ResourceModelBase } from "@microsoft/vscode-azureresources-api";
import { ext } from "../../extensionVariables";
import { ManagedEnvironmentItem } from "../../tree/ManagedEnvironmentItem";
import { localize } from "../localize";
import { type PickItemOptions } from "./PickItemOptions";

export function getPickEnvironmentSteps(skipIfOne: boolean = false, subscriptionId?: string, environmentName?: string | RegExp, excludeExpress: boolean = false): AzureWizardPromptStep<AzureResourceQuickPickWizardContext>[] {
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
        new EnvironmentQuickPickStep(tdp, environmentFilter, skipIfOne, excludeExpress)
    ];
}

class EnvironmentQuickPickStep extends ContextValueQuickPickStep<AzureResourceQuickPickWizardContext, ContextValueFilterQuickPickOptions> {
    constructor(tdp: ResourceGroupsTreeDataProvider, environmentFilter: RegExp, skipIfOne: boolean, excludeExpress: boolean) {
        super(tdp, {
            contextValueFilter: { include: environmentFilter },
            skipIfOne
        }, {
            placeHolder: localize('selectContainerAppsEnvironment', 'Select a container apps environment'),
            noPicksMessage: excludeExpress
                ? localize('noStandardContainerAppsEnvironment', 'Current subscription has no Standard container apps environments')
                : localize('noContainerAppsEnvironment', 'Current subscription has no container apps environments'),
        });

        if (excludeExpress) {
            const isSupportedEnvironment = (element: unknown): boolean => {
                const item: unknown = (element as { branchItem?: ResourceModelBase })?.branchItem ?? element;
                return !ManagedEnvironmentItem.isManagedEnvironmentItem(item) || !item.isExpress;
            };
            const isFinalPick = this.pickFilter.isFinalPick.bind(this.pickFilter);
            const isAncestorPick = this.pickFilter.isAncestorPick.bind(this.pickFilter);
            this.pickFilter.isFinalPick = (treeItem, element) =>
                isSupportedEnvironment(element) && isFinalPick(treeItem, element);
            // Excluded environments must not reappear as ancestors when no Standard environments exist.
            this.pickFilter.isAncestorPick = (treeItem, element) =>
                isSupportedEnvironment(element) && isAncestorPick(treeItem, element);
        }
    }
}

export async function pickEnvironment(context: IActionContext, options?: PickItemOptions): Promise<ManagedEnvironmentItem> {
    const promptSteps: AzureWizardPromptStep<QuickPickWizardContext>[] = [
        ...getPickEnvironmentSteps()
    ];

    return await runQuickPickWizard(context, {
        promptSteps,
        title: options?.title,
        showLoadingPrompt: options?.showLoadingPrompt
    });
}
