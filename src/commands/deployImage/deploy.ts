/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/
import { ContainerApp } from "@azure/arm-appcontainers";
import { AzureWizard, AzureWizardPromptStep } from "@microsoft/vscode-azext-utils";
import { ContainerAppItem } from "../../tree/ContainerAppItem";
import { localize } from "../../utils/localize";
import { pickContainerApp } from "../../utils/pickContainerApp";
import { ImageSourceListStep } from "../createContainerApp/ImageSourceListStep";
import { IDeployImageContext } from "./IDeployImageContext";

export async function deployContainerApp(context: IDeployImageContext): Promise<void> {
    const promptSteps: AzureWizardPromptStep<IDeployImageContext>[] = [];
    const wizardContext: IDeployImageContext = context;
    const wizard: AzureWizard<IDeployImageContext> = new AzureWizard(wizardContext, {
        promptSteps
    });

    context.targetContainer = await getContainerApp(context); //may need to change so it is more easy to add create

    const useQuickStartImage: boolean = false
    promptSteps.push(new ImageSourceListStep({ useQuickStartImage }));

    await wizard.prompt();
}

async function getContainerApp(context: IDeployImageContext, node?: ContainerAppItem): Promise<ContainerApp> {
    node ??= await pickContainerApp(context, {
        title: localize('deployContainerApp', 'Choose a Container App'),
    });

    return node.containerApp;
}
