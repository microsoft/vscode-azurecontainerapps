/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, createSubscriptionContext, IActionContext } from "@microsoft/vscode-azext-utils";
import { IngressEnabledItem } from "../../../tree/configurations/IngressItem";
import type { ContainerAppItem } from "../../../tree/ContainerAppItem";
import { createActivityContext } from "../../../utils/activity/activityUtils";
import { localize } from "../../../utils/localize";
import { pickContainerApp } from "../../../utils/pickItem/pickContainerApp";
import type { IngressContext } from "../IngressContext";
import { TargetPortInputStep } from "./TargetPortInputStep";
import { TargetPortUpdateStep } from "./TargetPortUpdateStep";

export async function editTargetPort(context: IActionContext, node?: IngressEnabledItem): Promise<void> {
    const { subscription, containerApp }: ContainerAppItem | IngressEnabledItem = node ?? await pickContainerApp(context);

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
