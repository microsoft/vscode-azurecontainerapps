/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ICreateLinkerContext, createLinker } from "@microsoft/vscode-azext-serviceconnector";
import { AzureWizard, AzureWizardPromptStep, createSubscriptionContext, nonNullValue } from "@microsoft/vscode-azext-utils";
import { ContainerAppItem } from "../../tree/ContainerAppItem";
import { createActivityContext } from "../../utils/activityUtils";
import { localize } from "../../utils/localize";
import { pickContainerApp } from "../../utils/pickContainerApp";
import { ContainerPickStep } from "./ContainerPickStep";
import { IServiceConnectorWithActivityContext } from "./IServiceConnectorContext";

export async function createServiceConnector(context: ICreateLinkerContext, item?: ContainerAppItem): Promise<void> {
    if (!item) {
        item = await pickContainerApp(context);
    }
    const { subscription, containerApp } = item;

    const createServiceTitle: string = localize('createServiceConnector', 'Create Service Connector');

    const wizardContext: IServiceConnectorWithActivityContext = {
        activityTitle: createServiceTitle,
        ...context,
        ...createSubscriptionContext(subscription),
        containerApp: containerApp,
        sourceResourceUri: containerApp.id,
        ...(await createActivityContext())
    }

    const promptSteps: AzureWizardPromptStep<IServiceConnectorWithActivityContext>[] = [
        new ContainerPickStep(),
    ];

    const wizard: AzureWizard<IServiceConnectorWithActivityContext> = new AzureWizard(wizardContext, {
        title: localize('createServiceConnector', 'Create Service Connector'),
        promptSteps,
    });

    await wizard.prompt();
    await createLinker(wizardContext, nonNullValue(item));
}
