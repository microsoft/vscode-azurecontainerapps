/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureWizard, AzureWizardPromptStep, createSubscriptionContext, IActionContext, nonNullProp, nonNullValueAndProp } from "@microsoft/vscode-azext-utils";
import { ContainerAppItem } from "../../tree/ContainerAppItem";
import { IngressItem } from "../../tree/IngressItem";
import { localize } from "../../utils/localize";
import { pickContainerApp } from "../../utils/pickContainerApp";
import { IContainerAppContext } from "../createContainerApp/IContainerAppContext";
import { TargetPortStep } from "../createContainerApp/TargetPortStep";
import { updateIngressSettings } from "./updateIngressSettings";

export async function editTargetPort(context: IActionContext, node?: IngressItem): Promise<void> {
    const { subscription, containerApp }: ContainerAppItem | IngressItem = node ?? await pickContainerApp(context);

    const title: string = localize('updateTargetPort', 'Update Target Port');
    const promptSteps: AzureWizardPromptStep<IContainerAppContext>[] = [new TargetPortStep()];

    const wizardContext: IContainerAppContext = {
        ...context,
        ...createSubscriptionContext(subscription),
        subscription,
        managedEnvironmentId: nonNullProp(containerApp, 'managedEnvironmentId'),
        defaultPort: containerApp.configuration?.ingress?.targetPort
    };

    const wizard: AzureWizard<IContainerAppContext> = new AzureWizard(wizardContext, {
        title,
        promptSteps,
        executeSteps: []
    });

    await wizard.prompt();
    const ingress = nonNullValueAndProp(containerApp.configuration, 'ingress');
    ingress.targetPort = wizardContext.targetPort;
    const working: string = localize('updatingTargetPort', 'Updating target port to {0}...', ingress.targetPort);
    const workCompleted: string = localize('updatedTargetPort', 'Updated target port to {0}', ingress.targetPort);
    await updateIngressSettings(context, { ingress, subscription, containerApp, working, workCompleted });
}
