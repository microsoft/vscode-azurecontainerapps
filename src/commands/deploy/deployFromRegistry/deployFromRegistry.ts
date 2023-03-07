/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { VerifyProvidersStep } from "@microsoft/vscode-azext-azureutils";
import { AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, ITreeItemPickerContext, createSubscriptionContext } from "@microsoft/vscode-azext-utils";
import { ImageSource, webProvider } from "../../../constants";
import { ContainerAppItem } from "../../../tree/ContainerAppItem";
import { localize } from "../../../utils/localize";
import { pickContainerApp } from "../../../utils/pickContainerApp";
import { ContainerAppOverwriteConfirmStep } from "../ContainerAppOverwriteConfirmStep";
import { ContainerAppUpdateStep } from "../ContainerAppUpdateStep";
import { EnvironmentVariablesListStep } from "../EnvironmentVariablesListStep";
import { ContainerRegistryListStep } from "./ContainerRegistryListStep";
import { IDeployFromRegistryContext } from "./IDeployFromRegistryContext";
import { DeployImageConfigureStep } from "./deployImageConfigureStep";

export async function deployFromRegistry(context: ITreeItemPickerContext & Partial<IDeployFromRegistryContext>, node?: ContainerAppItem): Promise<void> {
    if (!node) {
        context.suppressCreatePick = true;
        node = await pickContainerApp(context);
    }

    const { subscription, containerApp } = node;

    const wizardContext: IDeployFromRegistryContext = {
        ...context,
        ...createSubscriptionContext(subscription),
        subscription,
        targetContainer: containerApp,
        imageSource: ImageSource.ExternalRegistry
    };

    const title: string = localize('updateImage', 'Update image in "{0}"', containerApp.name);
    const promptSteps: AzureWizardPromptStep<IDeployFromRegistryContext>[] = [
        new ContainerAppOverwriteConfirmStep(),
        new ContainerRegistryListStep(),
        new EnvironmentVariablesListStep()
    ];
    const executeSteps: AzureWizardExecuteStep<IDeployFromRegistryContext>[] = [
        new VerifyProvidersStep([webProvider]),
        new DeployImageConfigureStep(),
        new ContainerAppUpdateStep()
    ];

    const wizard: AzureWizard<IDeployFromRegistryContext> = new AzureWizard(wizardContext, {
        title,
        promptSteps,
        executeSteps,
        showLoadingPrompt: true
    });

    await wizard.prompt();
    await wizard.execute();
}
