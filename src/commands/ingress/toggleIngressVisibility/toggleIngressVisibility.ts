import type { Ingress } from "@azure/arm-appcontainers";
import { AzureWizard, AzureWizardExecuteStep, IActionContext, createSubscriptionContext, nonNullValueAndProp } from "@microsoft/vscode-azext-utils";
import { IngressConstants } from "../../../constants";
import type { ContainerAppItem } from "../../../tree/ContainerAppItem";
import type { IngressItem } from "../../../tree/IngressItem";
import { createActivityContext } from "../../../utils/activityUtils";
import { localize } from "../../../utils/localize";
import { pickContainerApp } from "../../../utils/pickContainerApp";
import type { IngressContext } from "../IngressContext";
import { ToggleIngressVisibilityStep } from "./ToggleIngressVisibilityStep";

export async function toggleIngressVisibility(context: IActionContext, node?: IngressItem | ContainerAppItem): Promise<void> {
    const { subscription, containerApp } = node ?? await pickContainerApp(context);

    const wizardContext: IngressContext = {
        ...context,
        ...createSubscriptionContext(subscription),
        ...(await createActivityContext()),
        subscription,
        containerApp
    };

    const ingress: Ingress = nonNullValueAndProp(containerApp.configuration, 'ingress');
    const title: string = localize('toggleIngressVisibility', 'Toggle ingress visibility to "{0}" for container app "{1}"', ingress.external ? IngressConstants.internal : IngressConstants.external, containerApp.name);

    const executeSteps: AzureWizardExecuteStep<IngressContext>[] = [
        new ToggleIngressVisibilityStep()
    ];

    const wizard: AzureWizard<IngressContext> = new AzureWizard(wizardContext, {
        title,
        executeSteps,
        showLoadingPrompt: true
    });

    wizardContext.activityTitle = title;
    await wizard.execute();
}
