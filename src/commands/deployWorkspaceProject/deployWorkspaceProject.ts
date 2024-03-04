/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { callWithTelemetryAndErrorHandling, createSubscriptionContext, nonNullProp, subscriptionExperience, type AzureWizardExecuteStep, type AzureWizardPromptStep, type IActionContext, type ISubscriptionContext } from "@microsoft/vscode-azext-utils";
import { type AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { ProgressLocation, window } from "vscode";
import { ext } from "../../extensionVariables";
import { type SetTelemetryProps } from "../../telemetry/SetTelemetryProps";
import { type DeployWorkspaceProjectNotificationTelemetryProps as NotificationTelemetryProps } from "../../telemetry/commandTelemetryProps";
import { ContainerAppItem, isIngressEnabled, type ContainerAppModel } from "../../tree/ContainerAppItem";
import { ManagedEnvironmentItem } from "../../tree/ManagedEnvironmentItem";
import { localize } from "../../utils/localize";
import { type DeployWorkspaceProjectResults } from "../api/vscode-azurecontainerapps.api";
import { browseContainerApp } from "../browseContainerApp";
import { type DeployWorkspaceProjectContext } from "./DeployWorkspaceProjectContext";
import { getDefaultContextValues } from "./getDefaultValues/getDefaultContextValues";
import { getDeployWorkspaceProjectResults } from "./getDeployWorkspaceProjectResults";
import { deployWorkspaceProjectInternal, type DeployWorkspaceProjectInternalContext } from "./internal/deployWorkspaceProjectInternal";

export async function deployWorkspaceProject(context: IActionContext & Partial<DeployWorkspaceProjectContext>, item?: ContainerAppItem | ManagedEnvironmentItem): Promise<DeployWorkspaceProjectResults> {
    const subscription: AzureSubscription = await subscriptionExperience(context, ext.rgApiV2.resources.azureResourceTreeDataProvider);
    const subscriptionContext: ISubscriptionContext = createSubscriptionContext(subscription);

    // If an incompatible tree item is passed, treat it as if no item was passed
    if (item && !ContainerAppItem.isContainerAppItem(item) && !ManagedEnvironmentItem.isManagedEnvironmentItem(item)) {
        item = undefined;
    }

    /** TODO: Refactor getDefaultContextValues into wizard steps */
    // Show loading indicator while we configure default values
    let defaultContextValues: Partial<DeployWorkspaceProjectContext> | undefined;
    await window.withProgress({
        location: ProgressLocation.Notification,
        cancellable: false,
        title: localize('loadingWorkspaceTitle', 'Loading workspace project deployment configurations...')
    }, async () => {
        defaultContextValues = await getDefaultContextValues({ ...context, ...subscriptionContext }, item);
    });

    /** Example Start: No tree item */
    const promptSteps: AzureWizardPromptStep<DeployWorkspaceProjectContext>[] = [
        // Root folder step (Matt)
        // Docker file path step (Matt)
        // Confirm v1 to v2 settings conversion (Megan)
        // Prompt for settings configuration (Matt)
    ];

    const executeSteps: AzureWizardExecuteStep<DeployWorkspaceProjectContext>[] = [
        // Convert v1 to v2 settings (Megan)
        // Load settings into context (Matt)
        // Shallow validation (Megan?)
        // Deep validation (Matt?)
        // ACR defaulting logic (Megan?)
    ];
    /** End: No Tree Item */

    /** Example Start: Tree Item */
    const promptSteps: AzureWizardPromptStep<DeployWorkspaceProjectContext>[] = [
        // Root folder step (same as above)
        // Docker file path step (same as above)
    ];

    const executeSteps: AzureWizardExecuteStep<DeployWorkspaceProjectContext>[] = [
        // Load tree items settings into context (Matt)
    ];
    /** End: Tree Item */

    const wizard: AzureWizard<DeployWorkspaceProjectContext> = new AzureWizard(wizardContext, {
        title: localize('deployWorkspaceProjectTitle', 'Deploy workspace project to a container app'),
        promptSteps,
        executeSteps,
        showLoadingPrompt: true
    });

    const deployWorkspaceProjectInternalContext: DeployWorkspaceProjectInternalContext = Object.assign(context, {
        ...defaultContextValues,
        ...subscriptionContext,
        subscription
    });

    const deployWorkspaceProjectResultContext: DeployWorkspaceProjectContext = await deployWorkspaceProjectInternal(deployWorkspaceProjectInternalContext, {
        suppressActivity: false,
        suppressConfirmation: false,
        suppressContainerAppCreation: false,
        suppressWizardTitle: false
    });

    displayNotification(deployWorkspaceProjectResultContext);
    return await getDeployWorkspaceProjectResults(deployWorkspaceProjectResultContext);
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
