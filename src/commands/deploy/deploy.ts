/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/
import { VerifyProvidersStep } from "@microsoft/vscode-azext-azureutils";
import { AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, ITreeItemPickerContext, createSubscriptionContext } from "@microsoft/vscode-azext-utils";
import { webProvider } from "../../constants";
import { ContainerAppItem } from "../../tree/ContainerAppItem";
import { localize } from "../../utils/localize";
import { pickContainerApp } from "../../utils/pickContainerApp";
import { ContainerAppOverwriteConfirmStep } from "./ContainerAppOverwriteConfirmStep";
import { ContainerAppUpdateStep } from "./ContainerAppUpdateStep";
import { IDeployBaseContext } from "./IDeployBaseContext";
import { ImageSourceListStep } from "./ImageSourceListStep";

export async function deploy(context: ITreeItemPickerContext & Partial<IDeployBaseContext>, node?: ContainerAppItem): Promise<void> {
    if (!node) {
        context.suppressCreatePick = true;
        node = await pickContainerApp(context);
    }

    const { subscription, containerApp } = node;

    const wizardContext: IDeployBaseContext = {
        ...context,
        ...createSubscriptionContext(subscription),
        subscription,
        targetContainer: containerApp
    };

    const promptSteps: AzureWizardPromptStep<IDeployBaseContext>[] = [
        new ContainerAppOverwriteConfirmStep(),
        new ImageSourceListStep()
    ];

    const executeSteps: AzureWizardExecuteStep<IDeployBaseContext>[] = [
        new VerifyProvidersStep([webProvider]),
        new ContainerAppUpdateStep()
    ];

    const wizard: AzureWizard<IDeployBaseContext> = new AzureWizard(wizardContext, {
        title: localize('deploy', 'Deploying to "{0}"', containerApp.name),
        promptSteps,
        executeSteps,
        showLoadingPrompt: true
    });

    await wizard.prompt();
    await wizard.execute();
}
