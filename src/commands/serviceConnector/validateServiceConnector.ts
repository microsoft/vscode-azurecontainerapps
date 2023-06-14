/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ICreateLinkerContext, validateLinker } from "@microsoft/vscode-azext-serviceconnector";
import { AzureWizardPromptStep } from "@microsoft/vscode-azext-utils";
import { ContainerAppItem } from "../../tree/ContainerAppItem";
import { createActivityContext } from "../../utils/activityUtils";
import { localize } from "../../utils/localize";
import { pickContainerApp } from "../../utils/pickContainerApp";
import { ContainerListStep } from "./ContainerListStep";
import { IServiceConnectorContext } from "./IServiceConnectorContext";

export async function validateServiceConnector(context: ICreateLinkerContext, item?: ContainerAppItem): Promise<void> {
    item ??= await pickContainerApp(context);
    const { subscription, containerApp } = item;

    const activityContext = {
        ...context,
        ...await createActivityContext(),
        containerApp: containerApp,
        activityTitle: localize('validateServiceConnector', 'Validate Service Connector'),
    }

    const promptSteps: AzureWizardPromptStep<IServiceConnectorContext>[] = [
        new ContainerListStep(),
    ];

    await validateLinker(activityContext, { id: containerApp.id, subscription }, promptSteps);
}
