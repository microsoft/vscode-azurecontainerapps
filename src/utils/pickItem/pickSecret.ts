/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, ContextValueQuickPickStep, IActionContext, QuickPickWizardContext, runQuickPickWizard } from "@microsoft/vscode-azext-utils";
import { ext } from "../../extensionVariables";
import { SecretItem } from "../../tree/configurations/secrets/SecretItem";
import { SecretsItem } from "../../tree/configurations/secrets/SecretsItem";
import { localize } from "../localize";
import { PickItemOptions } from "./PickItemOptions";
import { getPickConfigurationsStep } from "./pickConfigurations";
import { getPickContainerAppSteps } from "./pickContainerApp";

function getPickSecretsStep(): AzureWizardPromptStep<QuickPickWizardContext> {
    return new ContextValueQuickPickStep(ext.rgApiV2.resources.azureResourceTreeDataProvider, {
        contextValueFilter: { include: SecretsItem.contextValueRegExp },
        skipIfOne: true,
    });
}

function getPickSecretStep(): AzureWizardPromptStep<QuickPickWizardContext> {
    return new ContextValueQuickPickStep(ext.rgApiV2.resources.azureResourceTreeDataProvider, {
        contextValueFilter: { include: SecretItem.contextValueRegExp },
    }, {
        placeHolder: localize('selectSecretStep', 'Select a secret'),
        noPicksMessage: localize('noSecrets', 'Selected container app has no secrets'),
    });
}

export async function pickSecret(context: IActionContext, options?: PickItemOptions): Promise<SecretItem> {
    const promptSteps: AzureWizardPromptStep<QuickPickWizardContext>[] = [
        ...getPickContainerAppSteps(),
        getPickConfigurationsStep(),
        getPickSecretsStep(),
        getPickSecretStep()
    ];

    return await runQuickPickWizard(context, {
        promptSteps,
        title: options?.title,
        showLoadingPrompt: options?.showLoadingPrompt
    });
}
