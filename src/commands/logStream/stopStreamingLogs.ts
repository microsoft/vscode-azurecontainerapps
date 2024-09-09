/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureWizard, createSubscriptionContext, type AzureWizardPromptStep, type IActionContext } from "@microsoft/vscode-azext-utils";
import { type ContainerAppItem } from "../../tree/ContainerAppItem";
import { createActivityContext } from "../../utils/activityUtils";
import { localize } from "../../utils/localize";
import { pickContainerApp } from "../../utils/pickItem/pickContainerApp";
import { type IStreamLogsContext } from "./IStreamLogsContext";
import { RevisionListStep } from "./RevisionListStep";
import { StreamListStep } from "./StreamListStep";
import { disconnectLogStreaming } from "./logStreamRequest";

export async function stopStreamingLogs(context: IActionContext, node?: ContainerAppItem): Promise<void> {
    if (!node) {
        node = await pickContainerApp(context);
    }

    const { subscription, containerApp } = node;

    const wizardContext: IStreamLogsContext = {
        ...context,
        ...createSubscriptionContext(subscription),
        subscription: subscription,
        containerApp: containerApp,
        resourceGroupName: containerApp.resourceGroup,
        ...(await createActivityContext()),
    }

    const title: string = localize('stopStreamLogs', 'Stop Streaming Logs');

    const promptSteps: AzureWizardPromptStep<IStreamLogsContext>[] = [
        new RevisionListStep(),
        new StreamListStep(),
    ];

    const wizard: AzureWizard<IStreamLogsContext> = new AzureWizard(wizardContext, {
        title,
        promptSteps,
    })

    await wizard.prompt();

    await disconnectLogStreaming(wizardContext);
}
