/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureResourceQuickPickWizardContext, AzureWizardPromptStep, ContextValueQuickPickStep, IActionContext, QuickPickAzureSubscriptionStep, QuickPickGroupStep, QuickPickWizardContext, runQuickPickWizard } from "@microsoft/vscode-azext-utils";
import { AzExtResourceType, ResourceGroupsTreeDataProvider } from "@microsoft/vscode-azureresources-api";
import { ext } from "../../extensionVariables";
import { ManagedEnvironmentItem } from "../../tree/ManagedEnvironmentItem";
import { localize } from "../localize";
import type { PickItemOptions } from "./PickItemOptions";

export function getPickEnvironmentSteps(skipIfOne: boolean = false, environmentName?: string | RegExp): AzureWizardPromptStep<AzureResourceQuickPickWizardContext>[] {
    const tdp: ResourceGroupsTreeDataProvider = ext.rgApiV2.resources.azureResourceTreeDataProvider;
    const types = [AzExtResourceType.ContainerAppsEnvironment];

    let environmentFilter: RegExp | undefined;
    if (environmentName) {
        environmentFilter = environmentName instanceof RegExp ? environmentName : new RegExp(`^${environmentName}$`);
    } else {
        environmentFilter = ManagedEnvironmentItem.contextValueRegExp;
    }

    return [
        new QuickPickAzureSubscriptionStep(tdp),
        new QuickPickGroupStep(tdp, {
            groupType: types
        }),
        new ContextValueQuickPickStep(ext.rgApiV2.resources.azureResourceTreeDataProvider, {
            contextValueFilter: { include: environmentFilter },
            skipIfOne,
        }, {
            placeHolder: localize('selectContainerAppsEnvironment', 'Select a container apps environment'),
            noPicksMessage: localize('noContainerAppsEnvironment', 'Current subscription has no container apps environments'),
        })
    ];
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
