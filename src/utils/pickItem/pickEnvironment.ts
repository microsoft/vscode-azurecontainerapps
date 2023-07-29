/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureResourceQuickPickWizardContext, AzureWizardPromptStep, IActionContext, QuickPickAzureResourceStep, QuickPickAzureSubscriptionStep, QuickPickGroupStep, QuickPickWizardContext, runQuickPickWizard } from "@microsoft/vscode-azext-utils";
import { AzExtResourceType, ResourceGroupsTreeDataProvider } from "@microsoft/vscode-azureresources-api";
import { ext } from "../../extensionVariables";
import type { ManagedEnvironmentItem } from "../../tree/ManagedEnvironmentItem";
import { localize } from "../localize";
import type { PickItemOptions } from "./PickItemOptions";

export function getPickEnvironmentSteps(): AzureWizardPromptStep<AzureResourceQuickPickWizardContext>[] {
    const tdp: ResourceGroupsTreeDataProvider = ext.rgApiV2.resources.azureResourceTreeDataProvider;
    const types = [AzExtResourceType.ContainerAppsEnvironment];

    return [
        new QuickPickAzureSubscriptionStep(tdp),
        new QuickPickGroupStep(tdp, {
            groupType: types
        }),
        new QuickPickAzureResourceStep(tdp, {
            resourceTypes: types,
            skipIfOne: false,
        }, {
            placeHolder: localize('selectContainerAppsEnvironment', 'Select a container apps environment'),
        }),
    ];
}

export async function pickEnvironment(context: IActionContext, options?: PickItemOptions): Promise<ManagedEnvironmentItem> {
    const promptSteps: AzureWizardPromptStep<QuickPickWizardContext>[] = [
        ...getPickEnvironmentSteps()
    ];

    return await runQuickPickWizard(context, {
        promptSteps,
        title: options?.title,
    });
}
