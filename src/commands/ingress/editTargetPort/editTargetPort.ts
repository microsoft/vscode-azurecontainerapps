/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, createSubscriptionContext, IActionContext } from "@microsoft/vscode-azext-utils";
import type { ContainerAppItem } from "../../../tree/ContainerAppItem";
import { IngressItem } from "../../../tree/IngressItem";
import { createActivityContext } from "../../../utils/activityUtils";
import { localize } from "../../../utils/localize";
import { pickContainerApp } from "../../../utils/pickContainerApp";
import type { IngressContext } from "../IngressContext";
import { TargetPortInputStep } from "./TargetPortInputStep";
import { TargetPortUpdateStep } from "./TargetPortUpdateStep";

export async function editTargetPort(context: IActionContext, node?: IngressItem): Promise<void> {
    const { subscription, containerApp }: ContainerAppItem | IngressItem = node ?? await pickContainerApp(context);

    const wizardContext: IngressContext = {
        ...context,
        ...createSubscriptionContext(subscription),
        ...(await createActivityContext()),
        subscription,
        containerApp
    };

    const title: string = localize('updateTargetPort', 'Update target port for container app "{0}"', containerApp.name);

    const promptSteps: AzureWizardPromptStep<IngressContext>[] = [
        new TargetPortInputStep()
    ];

    const executeSteps: AzureWizardExecuteStep<IngressContext>[] = [
        new TargetPortUpdateStep()
    ];

    const wizard: AzureWizard<IngressContext> = new AzureWizard(wizardContext, {
        title,
        promptSteps,
        executeSteps,
        showLoadingPrompt: true
    });

    await wizard.prompt();
    await wizard.execute();
}
