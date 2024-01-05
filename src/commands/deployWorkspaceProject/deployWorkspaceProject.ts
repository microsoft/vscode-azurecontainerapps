/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type RegistryPassword } from "@azure/arm-containerregistry";
import { callWithTelemetryAndErrorHandling, createSubscriptionContext, nonNullProp, subscriptionExperience, type ExecuteActivityContext, type IActionContext, type ISubscriptionContext } from "@microsoft/vscode-azext-utils";
import { type AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { window } from "vscode";
import { ext } from "../../extensionVariables";
import { type SetTelemetryProps } from "../../telemetry/SetTelemetryProps";
import { type DeployWorkspaceProjectNotificationTelemetryProps as NotificationTelemetryProps } from "../../telemetry/commandTelemetryProps";
import { ContainerAppItem, isIngressEnabled, type ContainerAppModel } from "../../tree/ContainerAppItem";
import { ManagedEnvironmentItem } from "../../tree/ManagedEnvironmentItem";
import { createActivityContext } from "../../utils/activity/activityUtils";
import { localize } from "../../utils/localize";
import { type DeployWorkspaceProjectResults } from "../../vscode-azurecontainerapps.api";
import { browseContainerApp } from "../browseContainerApp";
import { listCredentialsFromRegistry } from "../image/imageSource/containerRegistry/acr/listCredentialsFromRegistry";
import { type DeployWorkspaceProjectContext } from "./DeployWorkspaceProjectContext";
import { deployWorkspaceProjectInternal } from "./deployWorkspaceProjectInternal";

export async function deployWorkspaceProject(context: IActionContext & Partial<DeployWorkspaceProjectContext>, item?: ContainerAppItem | ManagedEnvironmentItem): Promise<DeployWorkspaceProjectResults> {
    // If an incompatible tree item is passed, treat it as if no item was passed
    if (item && !ContainerAppItem.isContainerAppItem(item) && !ManagedEnvironmentItem.isManagedEnvironmentItem(item)) {
        item = undefined;
    }

    const subscription: AzureSubscription = context.subscription ?? await subscriptionExperience(context, ext.rgApiV2.resources.azureResourceTreeDataProvider);
    const subscriptionContext: ISubscriptionContext = createSubscriptionContext(subscription);

    let activityContext: Partial<ExecuteActivityContext>;
    if (context.invokedFromApi) {
        // Don't show activity log updates in ACA when another client extension calls into this API.
        // Let each client decide how it wants to show its own activity log updates.
        activityContext = { suppressNotification: true };
    } else {
        activityContext = await createActivityContext();
        activityContext.activityChildren = [];
    }

    const wizardContext: DeployWorkspaceProjectContext = await deployWorkspaceProjectInternal(context, item, {
        subscription,
        subscriptionContext,
        activityContext,
        showProgress: !context.invokedFromApi,
        showActivityTitle: !context.invokedFromApi,
        showWizardTitle: !context.invokedFromApi
    });

    if (!wizardContext.invokedFromApi) {
        displayNotification(wizardContext);
    }

    const registryCredentials: { username: string, password: RegistryPassword } | undefined = wizardContext.registry ? await listCredentialsFromRegistry(wizardContext, wizardContext.registry) : undefined;
    return {
        resourceGroupId: wizardContext.resourceGroup?.id,
        logAnalyticsWorkspaceId: wizardContext.logAnalyticsWorkspace?.id,
        managedEnvironmentId: wizardContext.managedEnvironment?.id,
        containerAppId: wizardContext.containerApp?.id,
        registryId: wizardContext.registry?.id,
        registryLoginServer: wizardContext.registry?.loginServer,
        registryUsername: registryCredentials?.username,
        registryPassword: registryCredentials?.password.value,
        imageName: wizardContext.imageName
    };
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
