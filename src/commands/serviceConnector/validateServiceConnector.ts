/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { validateLinker } from "@microsoft/vscode-azext-serviceconnector";
import { AzureWizard, AzureWizardPromptStep, IActionContext, createSubscriptionContext } from "@microsoft/vscode-azext-utils";
import { ContainerAppItem } from "../../tree/ContainerAppItem";
import { createActivityContext } from "../../utils/activityUtils";
import { localize } from "../../utils/localize";
import { pickContainerApp } from "../../utils/pickContainerApp";
import { ContainerPickStep } from "./ContainerPickStep";
import { IServiceConnectorWithActivityContext } from "./IServiceConnectorContext";

export async function validateServiceConnector(context: IActionContext, item?: ContainerAppItem): Promise<void> {
    if (!item) {
        item = await pickContainerApp(context);
    }

    const { subscription, containerApp } = item;

    const wizardContext: IServiceConnectorWithActivityContext = {
        activityTitle: localize('createServiceConnector', 'Validate Service Connector'),
        ...context,
        ...createSubscriptionContext(subscription),
        containerApp: containerApp,
        ...(await createActivityContext())
    }

    const promptSteps: AzureWizardPromptStep<IServiceConnectorWithActivityContext>[] = [
        new ContainerPickStep(),
    ];

    const wizard: AzureWizard<IServiceConnectorWithActivityContext> = new AzureWizard(wizardContext, {
        title: localize('deleteServiceConnector', 'Delete Service Connector'),
        promptSteps,
    });

    await wizard.prompt();
    await validateLinker(wizardContext, item);
}
