/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizard, AzureWizardPromptStep, IActionContext, createSubscriptionContext } from '@microsoft/vscode-azext-utils';
import { ContainerAppsItem } from "../../../tree/ContainerAppsBranchDataProvider";
import { createActivityContext } from '../../../utils/activityUtils';
import { localize } from '../../../utils/localize';
import { pickContainerApp } from "../../../utils/pickContainerApp";
import { IngressContext } from '../IngressContext';
import { IngressPromptStep } from '../IngressPromptStep';
import { isIngressEnabled } from '../isIngressEnabled';

export async function disableIngress(context: IActionContext, node?: ContainerAppsItem): Promise<void> {
    const { subscription, containerApp } = node ??= await pickContainerApp(context);

    const wizardContext: IngressContext = {
        ...context,
        ...createSubscriptionContext(subscription),
        ...(await createActivityContext()),
        subscription,
        containerApp,
        enableIngress: false
    };

    if (!isIngressEnabled(wizardContext)) {
        throw new Error(localize('ingressNotEnabled', 'Ingress not currently enabled for container app "{0}".', containerApp.name));
    }

    const title: string = localize('disable', 'Disable ingress for container app "{0}"', containerApp.name);

    const promptSteps: AzureWizardPromptStep<IngressContext>[] = [
        new IngressPromptStep()
    ];

    const wizard: AzureWizard<IngressContext> = new AzureWizard(wizardContext, {
        title,
        promptSteps,
        showLoadingPrompt: true
    });

    await wizard.prompt();
    await wizard.execute();
}
