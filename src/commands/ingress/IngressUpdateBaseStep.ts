/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Ingress } from "@azure/arm-appcontainers";
import { AzureWizardExecuteStep, nonNullProp } from "@microsoft/vscode-azext-utils";
import { Progress } from "vscode";
import { ext } from "../../extensionVariables";
import { IContainerAppContext } from "../IContainerAppContext";
import { updateContainerApp } from "../deployContainerApp/updateContainerApp";

type IngressOptions = {
    ingress: Ingress | null,
    working: string,
    workCompleted: string
}

export abstract class IngressUpdateBaseStep<T extends IContainerAppContext> extends AzureWizardExecuteStep<T> {
    protected async updateIngressSettings(context: T, progress: Progress<{ message?: string | undefined}>, options: IngressOptions): Promise<void> {
        const containerApp = nonNullProp(context, 'containerApp');
        const { ingress, working, workCompleted } = options;

        progress.report({ message: working });
        await updateContainerApp(context, context.subscription, containerApp, { configuration: { ingress: ingress as Ingress | undefined } });

        ext.outputChannel.appendLog(workCompleted);
        ext.state.notifyChildrenChanged(containerApp.managedEnvironmentId);
    }
}
