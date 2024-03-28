/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { callWithTelemetryAndErrorHandling, createSubscriptionContext, nonNullProp, subscriptionExperience, type IActionContext, type ISubscriptionContext } from "@microsoft/vscode-azext-utils";
import { type AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { window } from "vscode";
import { ext } from "../../extensionVariables";
import { type SetTelemetryProps } from "../../telemetry/SetTelemetryProps";
import { type DeployWorkspaceProjectNotificationTelemetryProps as NotificationTelemetryProps } from "../../telemetry/deployWorkspaceProjectTelemetryProps";
import { ContainerAppItem, isIngressEnabled, type ContainerAppModel } from "../../tree/ContainerAppItem";
import { ManagedEnvironmentItem } from "../../tree/ManagedEnvironmentItem";
import { localize } from "../../utils/localize";
import { type IContainerAppContext } from "../IContainerAppContext";
import { type DeployWorkspaceProjectResults } from "../api/vscode-azurecontainerapps.api";
import { browseContainerApp } from "../browseContainerApp";
import { type DeployWorkspaceProjectContext } from "./DeployWorkspaceProjectContext";
import { type DeploymentConfiguration } from "./deploymentConfiguration/DeploymentConfiguration";
import { getTreeItemDeploymentConfiguration } from "./deploymentConfiguration/getTreeItemDeploymentConfiguration";
import { getWorkspaceDeploymentConfiguration } from "./deploymentConfiguration/workspace/getWorkspaceDeploymentConfiguration";
import { getDeployWorkspaceProjectResults } from "./getDeployWorkspaceProjectResults";
import { type DeployWorkspaceProjectInternalContext } from "./internal/DeployWorkspaceProjectInternalContext";
import { deployWorkspaceProjectInternal } from "./internal/deployWorkspaceProjectInternal";
import { convertSettingsSchema } from "./settings/convertSettings/convertSettingsSchema";

export async function deployWorkspaceProject(context: IActionContext & Partial<DeployWorkspaceProjectContext>, item?: ContainerAppItem | ManagedEnvironmentItem): Promise<DeployWorkspaceProjectResults> {
    // If an incompatible tree item is passed, treat it as if no item was passed
    if (item && !ContainerAppItem.isContainerAppItem(item) && !ManagedEnvironmentItem.isManagedEnvironmentItem(item)) {
        item = undefined;
    }

    const subscription: AzureSubscription = item?.subscription ?? await subscriptionExperience(context, ext.rgApiV2.resources.azureResourceTreeDataProvider);
    const subscriptionContext: ISubscriptionContext = createSubscriptionContext(subscription);
    const containerAppContext: IContainerAppContext = Object.assign(context, {
        ...subscriptionContext,
        subscription
    });

    let deploymentConfiguration: DeploymentConfiguration;
    if (item) {
        deploymentConfiguration = await getTreeItemDeploymentConfiguration(item);
    } else {
        await convertSettingsSchema(containerAppContext);
        deploymentConfiguration = await getWorkspaceDeploymentConfiguration({ ...containerAppContext });
    }

    const deployWorkspaceProjectInternalContext: DeployWorkspaceProjectInternalContext = Object.assign(containerAppContext, {
        ...deploymentConfiguration,
    });

    const deployWorkspaceProjectContext: DeployWorkspaceProjectContext = await deployWorkspaceProjectInternal(deployWorkspaceProjectInternalContext, {
        suppressActivity: false,
        suppressConfirmation: false,
        suppressContainerAppCreation: false,
        suppressProgress: false,
        suppressWizardTitle: false
    });

    displayNotification(deployWorkspaceProjectContext);
    return await getDeployWorkspaceProjectResults(deployWorkspaceProjectContext);
}

function displayNotification(context: DeployWorkspaceProjectContext): void {
    const browse: string = localize('browse', 'Browse');
    const viewOutput: string = localize('viewOutput', 'View Output');

    const message: string = localize('finishedDeploying', 'Finished deploying workspace project to container app "{0}".', context.containerApp?.name);
    const buttonMessages: string[] = context.targetPort ? [browse, viewOutput] : [viewOutput];

    const containerApp: ContainerAppModel = nonNullProp(context, 'containerApp');
    void window.showInformationMessage(message, ...buttonMessages).then(async (result: string | undefined) => {
        await callWithTelemetryAndErrorHandling('deployWorkspaceProject.displayNotification',
            async (telemetryContext: IActionContext & SetTelemetryProps<NotificationTelemetryProps>) => {
                if (result === viewOutput) {
                    telemetryContext.telemetry.properties.userAction = 'viewOutput';
                    ext.outputChannel.show();
                } else if (result === browse) {
                    telemetryContext.telemetry.properties.userAction = 'browse';
                    await browseContainerApp(containerApp);
                } else {
                    telemetryContext.telemetry.properties.userAction = 'canceled';
                }
            }
        );
    });

    // Provide browse link automatically to output channel
    if (isIngressEnabled(containerApp)) {
        ext.outputChannel.appendLog(localize('browseContainerApp', 'Deployed to: {0}', `https://${containerApp.configuration.ingress.fqdn}`));
    }
}
