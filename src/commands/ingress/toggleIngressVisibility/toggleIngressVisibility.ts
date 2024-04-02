/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type Ingress } from "@azure/arm-appcontainers";
import { AzureWizard, createSubscriptionContext, nonNullValueAndProp, type AzureWizardExecuteStep, type IActionContext } from "@microsoft/vscode-azext-utils";
import { IngressConstants } from "../../../constants";
import { ext } from "../../../extensionVariables";
import { type ContainerAppItem } from "../../../tree/ContainerAppItem";
import { type IngressEnabledItem } from "../../../tree/configurations/IngressItem";
import { createActivityContext } from "../../../utils/activity/activityUtils";
import { localize } from "../../../utils/localize";
import { pickContainerApp } from "../../../utils/pickItem/pickContainerApp";
import { type IngressBaseContext } from "../IngressContext";
import { ToggleIngressVisibilityStep } from "./ToggleIngressVisibilityStep";

export async function toggleIngressVisibility(context: IActionContext, node?: IngressEnabledItem | ContainerAppItem): Promise<void> {
    const { subscription, containerApp } = node ?? await pickContainerApp(context);

    const wizardContext: IngressBaseContext = {
        ...context,
        ...createSubscriptionContext(subscription),
        ...(await createActivityContext()),
        subscription,
        containerApp
    };

    const ingress: Ingress = nonNullValueAndProp(containerApp.configuration, 'ingress');
    const title: string = localize('toggleIngressVisibility', 'Toggle ingress visibility to "{0}" for container app "{1}"', ingress.external ? IngressConstants.internal : IngressConstants.external, containerApp.name);

    const executeSteps: AzureWizardExecuteStep<IngressBaseContext>[] = [
        new ToggleIngressVisibilityStep()
    ];

    const wizard: AzureWizard<IngressBaseContext> = new AzureWizard(wizardContext, {
        title,
        executeSteps,
        showLoadingPrompt: true
    });

    // Title normally gets set during prompt phase... since no prompt steps are provided we must set the 'activityTitle' manually
    wizardContext.activityTitle = title;
    await wizard.execute();

    ext.state.notifyChildrenChanged(containerApp.managedEnvironmentId);
}
