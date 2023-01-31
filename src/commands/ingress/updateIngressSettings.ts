/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { Ingress } from "@azure/arm-appcontainers";
import { IActionContext } from "@microsoft/vscode-azext-utils";
import { AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { ProgressLocation, window } from "vscode";
import { ext } from "../../extensionVariables";
import { ContainerAppModel } from "../../tree/ContainerAppItem";
import { updateContainerApp } from "../updateContainerApp";

export async function updateIngressSettings(context: IActionContext,
    options: {
        ingress: Ingress | null,
        subscription: AzureSubscription,
        containerApp: ContainerAppModel,
        working: string,
        workCompleted: string
    }): Promise<void> {
    const { ingress, subscription, containerApp, working, workCompleted } = options;

    await window.withProgress({ location: ProgressLocation.Notification, title: working }, async (): Promise<void> => {
        ext.outputChannel.appendLog(working);
        await updateContainerApp(context, subscription, containerApp, { configuration: { ingress: ingress as Ingress | undefined } })

        void window.showInformationMessage(workCompleted);
        ext.outputChannel.appendLog(workCompleted);
    });

    ext.state.notifyChildrenChanged(containerApp.managedEnvironmentId)
}
