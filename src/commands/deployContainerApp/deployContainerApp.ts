/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/
import { VerifyProvidersStep } from "@microsoft/vscode-azext-azureutils";
import { AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, ITreeItemPickerContext, createSubscriptionContext } from "@microsoft/vscode-azext-utils";
import { webProvider } from "../../constants";
import { ContainerAppItem } from "../../tree/ContainerAppItem";
import { localize } from "../../utils/localize";
import { pickContainerApp } from "../../utils/pickItem/pickContainerApp";
import { ImageSourceBaseContext } from "../imageSource/ImageSourceBaseContext";
import { ImageSourceListStep } from "../imageSource/ImageSourceListStep";
import { ContainerAppOverwriteConfirmStep } from "./ContainerAppOverwriteConfirmStep";
import { ContainerAppUpdateStep } from "./ContainerAppUpdateStep";

export type IDeployContainerAppContext = ImageSourceBaseContext;

export async function deployContainerApp(context: ITreeItemPickerContext & Partial<IDeployContainerAppContext>, node?: ContainerAppItem): Promise<void> {
    if (!node) {
        context.suppressCreatePick = true;
        node = await pickContainerApp(context);
    }

    const { subscription, containerApp } = node;

    const wizardContext: IDeployContainerAppContext = {
        ...context,
        ...createSubscriptionContext(subscription),
        subscription,
        containerApp
    };

    const promptSteps: AzureWizardPromptStep<IDeployContainerAppContext>[] = [
        new ContainerAppOverwriteConfirmStep(),
        new ImageSourceListStep()
    ];

    const executeSteps: AzureWizardExecuteStep<IDeployContainerAppContext>[] = [
        new VerifyProvidersStep([webProvider]),
        new ContainerAppUpdateStep()
    ];

    const wizard: AzureWizard<IDeployContainerAppContext> = new AzureWizard(wizardContext, {
        title: localize('deploy', 'Deploying to "{0}"', containerApp.name),
        promptSteps,
        executeSteps,
        showLoadingPrompt: true
    });

    await wizard.prompt();
    await wizard.execute();
}
