/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Ingress } from "@azure/arm-appcontainers";
import { AzureWizard, IActionContext, nonNullProp } from '@microsoft/vscode-azext-utils';
import { AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { ContainerAppModel } from "../../tree/ContainerAppItem";
import { ContainerAppsItem, createSubscriptionContext } from "../../tree/ContainerAppsBranchDataProvider";
import { localize } from '../../utils/localize';
import { pickContainerApp } from "../../utils/pickContainerApp";
import { EnableIngressStep } from '../createContainerApp/EnableIngressStep';
import { IContainerAppContext } from '../createContainerApp/IContainerAppContext';
import { updateIngressSettings } from "./updateIngressSettings";

export async function enableIngress(context: IActionContext, node?: ContainerAppsItem): Promise<void> {
    const { subscription, containerApp } = node ??= await pickContainerApp(context);

    await updateIngressSettings(context, {
        ingress: await promptForIngressConfiguration(context, subscription, containerApp),
        subscription: subscription,
        containerApp: containerApp,
        working: localize('enabling', 'Enabling ingress for container app "{0}"...', containerApp.name),
        workCompleted: localize('enableCompleted', 'Enabled ingress for container app "{0}"', containerApp.name),
    });
}

async function promptForIngressConfiguration(context: IActionContext, subscription: AzureSubscription, containerApp: ContainerAppModel): Promise<Ingress> {
    const title: string = localize('enableIngress', 'Enable Ingress');
    const wizardContext: IContainerAppContext = {
        ...context,
        ...createSubscriptionContext(subscription),
        managedEnvironmentId: nonNullProp(containerApp, 'managedEnvironmentId'),
    };
    const wizard: AzureWizard<IContainerAppContext> = new AzureWizard(wizardContext, {
        title,
        promptSteps: [new EnableIngressStep()]
    });

    wizardContext.enableIngress = true;
    await wizard.prompt();

    return {
        targetPort: wizardContext.targetPort,
        external: wizardContext.enableExternal,
        transport: 'auto',
        allowInsecure: false,
        traffic: [
            {
                "weight": 100,
                "latestRevision": true
            }
        ],
    };
}
