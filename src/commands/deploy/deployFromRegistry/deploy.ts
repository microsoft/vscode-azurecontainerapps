/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/
import { AzureWizard, AzureWizardPromptStep, ITreeItemPickerContext, createSubscriptionContext } from "@microsoft/vscode-azext-utils";
import { ContainerAppItem, ContainerAppModel } from "../../../tree/ContainerAppItem";
import { localize } from "../../../utils/localize";
import { pickContainerApp } from "../../../utils/pickContainerApp";
import { IDeployBaseContext } from "../IDeployBaseContext";
import { ImageSourceListStep } from "../ImageSourceListStep";


export async function deployContainerApp(context: ITreeItemPickerContext & Partial<IDeployBaseContext>, node?: ContainerAppItem): Promise<void> {
    if (!node) {
        context.suppressCreatePick = true;
        node = await pickContainerApp(context);
    }

    const { subscription, containerApp } = node;

    const promptSteps: AzureWizardPromptStep<IDeployBaseContext>[] = [];
    const wizardContext: IDeployBaseContext = {
        ...context,
        ...createSubscriptionContext(subscription),
        subscription,
        targetContainer: containerApp
    };
    const wizard: AzureWizard<IDeployBaseContext> = new AzureWizard(wizardContext, {
        promptSteps
    });

    context.targetContainer = await getContainerApp(wizardContext);

    promptSteps.push(new ImageSourceListStep({ useQuickStartImage: false }));

    await wizard.prompt();
}

async function getContainerApp(context: IDeployBaseContext, node?: ContainerAppItem): Promise<ContainerAppModel> {
    node ??= await pickContainerApp(context, {
        title: localize('deployContainerApp', 'Choose a Container App'),
    });

    return ContainerAppItem.CreateContainerAppModel(node.containerApp);
}
