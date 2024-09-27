/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ContextValueQuickPickStep, runQuickPickWizard, type AzureWizardPromptStep, type IActionContext, type QuickPickWizardContext } from "@microsoft/vscode-azext-utils";
import { ext } from "../../extensionVariables";
import { type ContainerAppItem } from "../../tree/ContainerAppItem";
import { EnvironmentVariablesItem } from "../../tree/containers/EnvironmentVariablesItem";
import { getPickContainerSteps } from "./pickContainer";
import { pickContainerApp } from "./pickContainerApp";
import { type RevisionDraftPickItemOptions } from "./PickItemOptions";

function getPickEnvironmentVariablesStep(): AzureWizardPromptStep<QuickPickWizardContext> {
    return new ContextValueQuickPickStep(ext.rgApiV2.resources.azureResourceTreeDataProvider, {
        contextValueFilter: { include: EnvironmentVariablesItem.contextValueRegExp },
        skipIfOne: true,
    });
}

export async function pickEnvironmentVariables(context: IActionContext, options?: RevisionDraftPickItemOptions): Promise<EnvironmentVariablesItem> {
    const containerAppItem: ContainerAppItem = await pickContainerApp(context);
    return await runQuickPickWizard(context, {
        promptSteps: [
            ...getPickContainerSteps(containerAppItem, options),
            getPickEnvironmentVariablesStep(),
        ],
        title: options?.title,
    }, containerAppItem);
}
