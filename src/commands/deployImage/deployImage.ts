/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/
import { VerifyProvidersStep } from "@microsoft/vscode-azext-azureutils";
import { AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, ITreeItemPickerContext, createSubscriptionContext } from "@microsoft/vscode-azext-utils";
import { webProvider } from "../../constants";
import type { ContainerAppItem } from "../../tree/ContainerAppItem";
import { localize } from "../../utils/localize";
import { pickContainerApp } from "../../utils/pickItem/pickContainerApp";
import { ContainerAppOverwriteConfirmStep } from "./ContainerAppOverwriteConfirmStep";
import { ContainerAppUpdateStep } from "./ContainerAppUpdateStep";
import type { ImageSourceBaseContext } from "./imageSource/ImageSourceBaseContext";
import { ImageSourceListStep } from "./imageSource/ImageSourceListStep";

export type IDeployImageContext = ImageSourceBaseContext;

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
        containerApp
    };

    const promptSteps: AzureWizardPromptStep<IDeployImageContext>[] = [
        new ImageSourceListStep(),
        new ContainerAppOverwriteConfirmStep(),
    ];

    const executeSteps: AzureWizardExecuteStep<IDeployImageContext>[] = [
        new VerifyProvidersStep([webProvider]),
        new ContainerAppUpdateStep()
    ];

    const wizard: AzureWizard<IDeployImageContext> = new AzureWizard(wizardContext, {
        title: localize('deploy', 'Deploying to "{0}"', containerApp.name),
        promptSteps,
        executeSteps,
        showLoadingPrompt: true
    });

    await wizard.prompt();
    await wizard.execute();
}
