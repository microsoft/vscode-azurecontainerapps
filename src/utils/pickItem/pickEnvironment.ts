/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureResourceQuickPickWizardContext, AzureWizardPromptStep, IActionContext, QuickPickAzureResourceStep, runQuickPickWizard } from "@microsoft/vscode-azext-utils";
import { AzExtResourceType, ResourceGroupsTreeDataProvider } from "@microsoft/vscode-azureresources-api";
import { ext } from "../../extensionVariables";
import type { ManagedEnvironmentItem } from "../../tree/ManagedEnvironmentItem";
import { localize } from "../localize";
import type { PickItemOptions } from "./PickItemOptions";
import { getPickContainerAppsGroupSteps } from "./pickContainerAppsGroup";

export function getPickEnvironmentSteps(): AzureWizardPromptStep<AzureResourceQuickPickWizardContext>[] {
    const tdp: ResourceGroupsTreeDataProvider = ext.rgApiV2.resources.azureResourceTreeDataProvider;
    const types = [AzExtResourceType.ContainerAppsEnvironment];

    return [
        ...getPickContainerAppsGroupSteps(),
        new QuickPickAzureResourceStep(tdp, {
            resourceTypes: types,
            skipIfOne: false,
        }, {
            placeHolder: localize('selectContainerAppsEnvironment', 'Select a container apps environment'),
        }),
    ];
}

export async function pickEnvironment(context: IActionContext, options?: PickItemOptions): Promise<ManagedEnvironmentItem> {
    return await runQuickPickWizard(context, {
        promptSteps: getPickEnvironmentSteps(),
        title: options?.title,
    });
}
