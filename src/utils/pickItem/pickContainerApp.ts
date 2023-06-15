/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureResourceQuickPickWizardContext, AzureWizardPromptStep, ContextValueQuickPickStep, IActionContext, QuickPickAzureResourceStep, QuickPickAzureSubscriptionStep, QuickPickGroupStep, ResourceGroupsItem, runQuickPickWizard } from "@microsoft/vscode-azext-utils";
import { AzExtResourceType } from "@microsoft/vscode-azureresources-api";
import * as vscode from 'vscode';
import { ext } from "../../extensionVariables";
import { ContainerAppItem } from "../../tree/ContainerAppItem";
import { ManagedEnvironmentItem } from "../../tree/ManagedEnvironmentItem";
import { localize } from "../localize";

export interface PickItemOptions {
    title?: string;
}

export function getPickEnvironmentSteps(tdp: vscode.TreeDataProvider<unknown>): AzureWizardPromptStep<AzureResourceQuickPickWizardContext>[] {
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

export async function containerAppEnvironmentExperience(context: IActionContext, tdp: vscode.TreeDataProvider<ResourceGroupsItem>, options?: PickItemOptions): Promise<ManagedEnvironmentItem> {
    return await runQuickPickWizard(context, {
        promptSteps: getPickEnvironmentSteps(tdp),
        title: options?.title,
    });
}

export async function containerAppExperience<TPick>(context: IActionContext, tdp: vscode.TreeDataProvider<ResourceGroupsItem>, options?: PickItemOptions): Promise<TPick> {
    return await runQuickPickWizard(context, {
        promptSteps: getPickContainerAppSteps(tdp),
        title: options?.title,
    });
}

export async function pickContainerApp(context: IActionContext, options?: PickItemOptions): Promise<ContainerAppItem> {
    return await containerAppExperience<ContainerAppItem>(context, ext.rgApiV2.resources.azureResourceTreeDataProvider, options);
}
