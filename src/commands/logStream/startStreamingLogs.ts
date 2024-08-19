/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureWizard, createSubscriptionContext, type AzureWizardPromptStep, type IActionContext } from "@microsoft/vscode-azext-utils";
import { type ContainerAppItem } from "../../tree/ContainerAppItem";
import { createActivityContext } from "../../utils/activityUtils";
import { localize } from "../../utils/localize";
import { pickContainerApp } from "../../utils/pickItem/pickContainerApp";
import { ContainerListStep } from "./ContainerListStep";
import { type IStreamLogsContext } from "./IStreamLogsContext";
import { ReplicaListStep } from "./ReplicaListStep";
import { RevisionListStep } from "./RevisionListStep";
import { logStreamRequest } from "./logStreamRequest";

export async function startStreamingLogs(context: IActionContext, item?: Pick<ContainerAppItem, 'containerApp' | 'subscription'>): Promise<void> {
    if (!item) {
        item = await pickContainerApp(context);
    }

    const { subscription, containerApp } = item;

    const wizardContext: IStreamLogsContext = {
        ...context,
        ...createSubscriptionContext(subscription),
        subscription: subscription,
        containerApp: containerApp,
        resourceGroupName: containerApp.resourceGroup,
        ...(await createActivityContext()),
    }

    const title: string = localize('startStreamLogs', 'Start Streaming Logs');

    const promptSteps: AzureWizardPromptStep<IStreamLogsContext>[] = [
        new RevisionListStep(),
        new ReplicaListStep(),
        new ContainerListStep(),
    ];

    const wizard: AzureWizard<IStreamLogsContext> = new AzureWizard(wizardContext, {
        title,
        promptSteps,
    });

    await wizard.prompt();

    await logStreamRequest(wizardContext);
}
