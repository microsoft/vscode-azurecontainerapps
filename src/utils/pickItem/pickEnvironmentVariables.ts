/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ContextValueQuickPickStep, runQuickPickWizard, type AzureResourceQuickPickWizardContext, type AzureWizardPromptStep, type IActionContext, type QuickPickWizardContext } from "@microsoft/vscode-azext-utils";
import { ext } from "../../extensionVariables";
import { EnvironmentVariableItem } from "../../tree/containers/EnvironmentVariableItem";
import { EnvironmentVariablesItem } from "../../tree/containers/EnvironmentVariablesItem";
import { localize } from "../localize";
import { ParentResourceItemPickSteps } from "./parentResourcePickSteps";
import { ContainerItemPickSteps } from "./pickContainer";
import { getPickContainerAppSteps } from "./pickContainerApp";
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

function getPickEnvironmentVariablesSteps(options?: RevisionDraftPickItemOptions): AzureWizardPromptStep<AzureResourceQuickPickWizardContext>[] {
    return [
        ...getPickContainerAppSteps(),
        new ParentResourceItemPickSteps(options),
        new ContainerItemPickSteps(),
        getPickEnvironmentVariablesStep(),
    ];
}

export async function pickEnvironmentVariables(context: IActionContext, options?: RevisionDraftPickItemOptions): Promise<EnvironmentVariablesItem> {
    return await runQuickPickWizard(context, {
        promptSteps: getPickEnvironmentVariablesSteps(options),
        title: options?.title,
    });
}

export async function pickEnvironmentVariable(context: IActionContext, options?: RevisionDraftPickItemOptions): Promise<EnvironmentVariableItem> {
    return await runQuickPickWizard(context, {
        promptSteps: [
            ...getPickEnvironmentVariablesSteps(options),
            getPickEnvironmentVariableStep(),
        ],
        title: options?.title,
    });
}
