/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizard, createSubscriptionContext, type AzureWizardPromptStep, type IActionContext } from '@microsoft/vscode-azext-utils';
import { ext } from '../../../extensionVariables';
import { type ContainerAppsItem } from "../../../tree/ContainerAppsBranchDataProvider";
import { createActivityContext } from '../../../utils/activityUtils';
import { localize } from '../../../utils/localize';
import { pickContainerApp } from "../../../utils/pickItem/pickContainerApp";
import { type IngressBaseContext } from "../IngressContext";
import { IngressPromptStep } from '../IngressPromptStep';

export async function enableIngress(context: IActionContext, node?: ContainerAppsItem): Promise<void> {
    const { subscription, containerApp } = node ?? await pickContainerApp(context);

    const wizardContext: IngressBaseContext = {
        ...context,
        ...createSubscriptionContext(subscription),
        ...(await createActivityContext()),
        subscription,
        containerApp,
        enableIngress: true
    };

    const title: string = localize('enableIngress', 'Enable ingress for container app "{0}"', containerApp.name);

    const promptSteps: AzureWizardPromptStep<IngressBaseContext>[] = [
        new IngressPromptStep()
    ];

    const wizard = new AzureWizard<IngressBaseContext>(wizardContext, {
        title,
        promptSteps,
        showLoadingPrompt: true
    });

    await wizard.prompt();
    const visibility: string = wizardContext.enableExternal ? localize('external', 'external') : localize('internal', 'internal');
    wizardContext.activityTitle = localize('enableIngressWithVisibility', 'Enable {0} ingress on port {1} for container app "{2}"', visibility, wizardContext.targetPort, containerApp.name);
    await wizard.execute();

    ext.state.notifyChildrenChanged(containerApp.managedEnvironmentId);
}
