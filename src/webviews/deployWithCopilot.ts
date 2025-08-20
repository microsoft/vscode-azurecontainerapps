/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureWizard, createSubscriptionContext, type IActionContext, type ISubscriptionActionContext, type ISubscriptionContext } from "@microsoft/vscode-azext-utils";
import * as vscode from 'vscode';
import { CommandAttributes } from "../commands/CommandAttributes";
import { ContainerAppOverwriteConfirmStep } from "../commands/ContainerAppOverwriteConfirmStep";
import { type ContainerAppDeployContext } from "../commands/deployContainerApp/ContainerAppDeployContext";
import { ContainerAppDeployStartingResourcesLogStep } from "../commands/deployContainerApp/ContainerAppDeployStartingResourcesLogStep";
import { ImageSourceListStep } from "../commands/image/imageSource/ImageSourceListStep";
import { type ContainerAppItem } from "../tree/ContainerAppItem";
import { createActivityContext } from "../utils/activityUtils";
import { getManagedEnvironmentFromContainerApp } from "../utils/getResourceUtils";
import { localize } from "../utils/localize";
import { pickContainerApp } from "../utils/pickItem/pickContainerApp";
import { CopilotUserInput } from "./CopilotUserInput";
import { OpenConfirmationViewStep } from "./OpenConfirmationViewStep";
import { OpenLoadingViewStep } from "./OpenLoadingViewStep";

export async function deployWithCopilot(context: IActionContext, node: ContainerAppItem): Promise<void> {
    const item: ContainerAppItem = node ?? await pickContainerApp(context);
    const subscriptionContext: ISubscriptionContext = createSubscriptionContext(item.subscription);
    const subscriptionActionContext: ISubscriptionActionContext = { ...context, ...subscriptionContext };

    const wizardContext: ContainerAppDeployContext = {
        ...subscriptionActionContext,
        ...await createActivityContext({ withChildren: true }),
        subscription: item.subscription,
        containerApp: item.containerApp,
        managedEnvironment: await getManagedEnvironmentFromContainerApp(subscriptionActionContext, item.containerApp),
        activityAttributes: CommandAttributes.DeployContainerAppContainerRegistry,
    };

    wizardContext.ui = new CopilotUserInput(vscode);

    const confirmationViewTitle: string = localize('summary', 'Copilot Summary');
    const confirmationViewTabTitle: string = localize('deployContainerAppTabTitle', 'Summary - Deploy Image to Container App using Copilot');
    const confirmationViewDescription: string = localize('viewDescription', 'Please select an input you would like to change. Note: Any input proceeding the changed input may need to change as well');
    const title: string = localize('deployContainerAppWithCopilotTitle', 'Deploy image to container app using copilot');
    const wizard: AzureWizard<ContainerAppDeployContext> = new AzureWizard(wizardContext, {
        title: title,
        promptSteps: [
            new OpenLoadingViewStep(),
            new ContainerAppDeployStartingResourcesLogStep(),
            new ImageSourceListStep(),
            new ContainerAppOverwriteConfirmStep(),
            new OpenConfirmationViewStep(confirmationViewTitle, confirmationViewTabTitle, confirmationViewDescription, title, () => wizard.confirmationViewProperties)
        ]
    });

    await wizard.prompt();
    await wizard.execute();
}

