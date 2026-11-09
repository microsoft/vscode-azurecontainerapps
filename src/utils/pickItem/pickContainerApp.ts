/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { parseAzureResourceId } from "@microsoft/vscode-azext-azureutils";
import { ContextValueQuickPickStep, nonNullProp, runQuickPickWizard, type AzureResourceQuickPickWizardContext, type AzureWizardPromptStep, type IActionContext, type ISubscriptionActionContext, type QuickPickWizardContext } from "@microsoft/vscode-azext-utils";
import { type ResourceGroupsTreeDataProvider } from "@microsoft/vscode-azureresources-api";
import { revisionRestartUnsupportedContextValue } from "../../constants";
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

    const treeDataProvider = ext.rgApiV2.resources.azureResourceTreeDataProvider;
    const pickerTreeDataProvider: ResourceGroupsTreeDataProvider = options?.excludeExpress ? {
        getTreeItem: element => treeDataProvider.getTreeItem(element),
        getChildren: async element => {
            const children = await treeDataProvider.getChildren(element) ?? [];
            const treeItems = await Promise.all(children.map(child => treeDataProvider.getTreeItem(child)));
            // Remove excluded apps before the shared picker considers expandable ancestor choices.
            return children.filter((_child, index) => !treeItems[index].contextValue?.split(';').includes(revisionRestartUnsupportedContextValue));
        },
    } : treeDataProvider;

    return new ContextValueQuickPickStep(pickerTreeDataProvider, {
        contextValueFilter: { include: containerAppFilter },
        skipIfOne: !!containerAppName,
    }, {
        placeHolder: localize('selectContainerApp', 'Select a container app'),
        noPicksMessage: options?.excludeExpress
            ? localize('noStandardContainerApps', 'Selected container apps environment has no Standard apps')
            : localize('noContainerApps', 'Selected container apps environment has no apps'),
    });
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
