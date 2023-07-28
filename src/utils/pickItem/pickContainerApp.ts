/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureResourceQuickPickWizardContext, AzureWizardPromptStep, ContextValueQuickPickStep, IActionContext, QuickPickWizardContext, runQuickPickWizard } from "@microsoft/vscode-azext-utils";
import type { ResourceGroupsTreeDataProvider } from "@microsoft/vscode-azureresources-api";
import * as vscode from 'vscode';
import { ext } from "../../extensionVariables";
import { ContainerAppItem } from "../../tree/ContainerAppItem";
import { localize } from "../localize";
import type { PickItemOptions } from "./PickItemOptions";
import { getPickEnvironmentSteps } from "./pickEnvironment";

export function getPickContainerAppSteps(tdp: vscode.TreeDataProvider<unknown>): AzureWizardPromptStep<AzureResourceQuickPickWizardContext>[] {
    return [
        ...getPickEnvironmentSteps(tdp),
        new ContextValueQuickPickStep(tdp, {
            contextValueFilter: { include: ContainerAppItem.contextValueRegExp },
            skipIfOne: true,
        }, {
            placeHolder: localize('selectContainerApp', 'Select a container app'),
            noPicksMessage: localize('noContainerApps', 'Selected container apps environment has no apps'),
        }),
    ];
}

export async function pickContainerApp(context: IActionContext, options?: PickItemOptions): Promise<ContainerAppItem> {
    const tdp: ResourceGroupsTreeDataProvider = ext.rgApiV2.resources.azureResourceTreeDataProvider;

    const promptSteps: AzureWizardPromptStep<QuickPickWizardContext>[] = [
        ...getPickContainerAppSteps(tdp)
    ];

    return await runQuickPickWizard(context, {
        promptSteps,
        title: options?.title,
    });
}
