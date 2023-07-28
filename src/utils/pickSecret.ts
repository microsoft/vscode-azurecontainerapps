/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, ContextValueQuickPickStep, IActionContext, QuickPickWizardContext, runQuickPickWizard } from "@microsoft/vscode-azext-utils";
import { ResourceGroupsTreeDataProvider } from "@microsoft/vscode-azureresources-api";
import * as vscode from "vscode";
import { ext } from "../extensionVariables";
import { ConfigurationItem } from "../tree/configurations/ConfigurationItem";
import { SecretItem } from "../tree/configurations/secrets/SecretItem";
import { SecretsItem } from "../tree/configurations/secrets/SecretsItem";
import { localize } from "./localize";
import { PickItemOptions, getPickContainerAppSteps } from "./pickContainerApp";

function getPickConfigurationsStep(tdp: vscode.TreeDataProvider<unknown>): AzureWizardPromptStep<QuickPickWizardContext> {
    return new ContextValueQuickPickStep(tdp, {
        contextValueFilter: { include: ConfigurationItem.contextValueRegExp },
        skipIfOne: true,
    });
}

function getPickSecretsStep(tdp: vscode.TreeDataProvider<unknown>): AzureWizardPromptStep<QuickPickWizardContext> {
    return new ContextValueQuickPickStep(tdp, {
        contextValueFilter: { include: SecretsItem.contextValueRegExp },
        skipIfOne: true,
    });
}

function getPickSecretStep(tdp: vscode.TreeDataProvider<unknown>): AzureWizardPromptStep<QuickPickWizardContext> {
    return new ContextValueQuickPickStep(tdp, {
        contextValueFilter: { include: SecretItem.contextValueRegExp },
        skipIfOne: true,
    }, {
        placeHolder: localize('selectSecretStep', 'Select a secret'),
        noPicksMessage: localize('noSecrets', 'Selected container app has no secrets'),
    });
}

export async function pickSecret(context: IActionContext, options?: PickItemOptions): Promise<SecretItem> {
    const tdp: ResourceGroupsTreeDataProvider = ext.rgApiV2.resources.azureResourceTreeDataProvider;

    const promptSteps: AzureWizardPromptStep<QuickPickWizardContext>[] = [
        ...getPickContainerAppSteps(tdp),
        getPickConfigurationsStep(tdp),
        getPickSecretsStep(tdp),
        getPickSecretStep(tdp)
    ];

    return await runQuickPickWizard(context, {
        promptSteps,
        title: options?.title,
    });
}
