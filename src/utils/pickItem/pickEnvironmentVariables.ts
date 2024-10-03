/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ContextValueQuickPickStep, runQuickPickWizard, type AzureWizardPromptStep, type IActionContext, type QuickPickWizardContext } from "@microsoft/vscode-azext-utils";
import { ext } from "../../extensionVariables";
import { type ContainerAppItem } from "../../tree/ContainerAppItem";
import { EnvironmentVariableItem } from "../../tree/containers/EnvironmentVariableItem";
import { EnvironmentVariablesItem } from "../../tree/containers/EnvironmentVariablesItem";
import { localize } from "../localize";
import { getPickContainerSteps } from "./pickContainer";
import { pickContainerApp } from "./pickContainerApp";
import { type RevisionDraftPickItemOptions } from "./PickItemOptions";

function getPickEnvironmentVariablesStep(): AzureWizardPromptStep<QuickPickWizardContext> {
    return new ContextValueQuickPickStep(ext.rgApiV2.resources.azureResourceTreeDataProvider, {
        contextValueFilter: { include: EnvironmentVariablesItem.contextValueRegExp },
        skipIfOne: true,
    });
}

function getPickEnvironmentVariableStep(): AzureWizardPromptStep<QuickPickWizardContext> {
    return new ContextValueQuickPickStep(ext.rgApiV2.resources.azureResourceTreeDataProvider, {
        contextValueFilter: { include: EnvironmentVariableItem.contextValueRegExp },
    }, {
        placeHolder: localize('selectEnvironmentVariable', 'Select an environment variable'),
        noPicksMessage: localize('noEnvironmentVariable', 'No environment variables available for this container'),
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

export async function pickEnvironmentVariable(context: IActionContext, options?: RevisionDraftPickItemOptions): Promise<EnvironmentVariableItem> {
    const containerAppItem: ContainerAppItem = await pickContainerApp(context);
    return await runQuickPickWizard(context, {
        promptSteps: [
            ...getPickContainerSteps(containerAppItem, options),
            getPickEnvironmentVariablesStep(),
            getPickEnvironmentVariableStep(),
        ],
        title: options?.title,
    }, containerAppItem);
}
