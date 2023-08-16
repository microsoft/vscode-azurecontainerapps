/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureResourceQuickPickWizardContext, AzureWizardPromptStep, IActionContext, QuickPickAzureSubscriptionStep, QuickPickGroupStep, TreeElementBase, runQuickPickWizard } from "@microsoft/vscode-azext-utils";
import { AzExtResourceType, ResourceGroupsTreeDataProvider } from "@microsoft/vscode-azureresources-api";
import { ext } from "../../extensionVariables";
import { PickItemOptions } from "./PickItemOptions";

export function getPickContainerAppsGroupSteps(): AzureWizardPromptStep<AzureResourceQuickPickWizardContext>[] {
    const tdp: ResourceGroupsTreeDataProvider = ext.rgApiV2.resources.azureResourceTreeDataProvider;
    const types = [AzExtResourceType.ContainerAppsEnvironment];

    return [
        new QuickPickAzureSubscriptionStep(tdp),
        new QuickPickGroupStep(tdp, {
            groupType: types
        })
    ];
}

export async function pickContainerAppsGroup(context: IActionContext, options?: PickItemOptions): Promise<TreeElementBase> {
    return await runQuickPickWizard(context, {
        promptSteps: getPickContainerAppsGroupSteps(),
        title: options?.title,
    });
}
