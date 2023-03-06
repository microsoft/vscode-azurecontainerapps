/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { VerifyProvidersStep } from "@microsoft/vscode-azext-azureutils";
import { AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, ITreeItemPickerContext, createSubscriptionContext } from "@microsoft/vscode-azext-utils";
import { ImageSource, webProvider } from "../../constants";
import { ContainerAppItem } from "../../tree/ContainerAppItem";
import { localize } from "../../utils/localize";
import { pickContainerApp } from "../../utils/pickContainerApp";
import { EnvironmentVariablesListStep } from "../createContainerApp/EnvironmentVariablesListStep";
import { ContainerAppOverwriteConfirmStep } from "../deploy/ContainerAppOverwriteConfirmStep";
import { ContainerAppUpdateStep } from "../deploy/ContainerAppUpdateStep";
import { ContainerRegistryListStep } from "./ContainerRegistryListStep";
import { IDeployImageContext } from "./IDeployImageContext";
import { DeployImageConfigureStep } from "./deployImageConfigureStep";

export async function deployImage(context: ITreeItemPickerContext & Partial<IDeployImageContext>, node?: ContainerAppItem): Promise<void> {
    if (!node) {
        context.suppressCreatePick = true;
        node = await pickContainerApp(context);
    }

    const { subscription, containerApp } = node;

    const wizardContext: IDeployImageContext = {
        ...context,
        ...createSubscriptionContext(subscription),
        subscription,
        targetContainer: containerApp,
        imageSource: ImageSource.ExternalRegistry
    };

    const title: string = localize('updateImage', 'Update image in "{0}"', containerApp.name);
    const promptSteps: AzureWizardPromptStep<IDeployImageContext>[] = [
        new ContainerAppOverwriteConfirmStep(),
        new ContainerRegistryListStep(),
        new EnvironmentVariablesListStep()
    ];
    const executeSteps: AzureWizardExecuteStep<IDeployImageContext>[] = [
        new VerifyProvidersStep([webProvider]),
        new DeployImageConfigureStep(),
        new ContainerAppUpdateStep()
    ];

    const wizard: AzureWizard<IDeployImageContext> = new AzureWizard(wizardContext, {
        title,
        promptSteps,
        executeSteps,
        showLoadingPrompt: true
    });

    await wizard.prompt();
    await wizard.execute();
}
