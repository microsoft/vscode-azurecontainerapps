/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { Ingress } from "@azure/arm-appcontainers";
import { AzureWizardExecuteStep, nonNullProp } from "@microsoft/vscode-azext-utils";
import type { Progress } from "vscode";
import { ext } from "../../extensionVariables";
import { updateContainerApp } from "../../utils/updateContainerApp/updateContainerApp";
import type { IContainerAppContext } from "../IContainerAppContext";

type IngressOptions = {
    ingress: Ingress | null,
    working: string,
    workCompleted: string
}

export abstract class IngressUpdateStepBase<T extends IContainerAppContext> extends AzureWizardExecuteStep<T> {
    protected async updateIngressSettings(context: T, progress: Progress<{ message?: string | undefined }>, options: IngressOptions): Promise<void> {
        const containerApp = nonNullProp(context, 'containerApp');
        const { ingress, working, workCompleted } = options;

        progress.report({ message: working });
        await updateContainerApp(context, context.subscription, containerApp, { configuration: { ingress: ingress as Ingress | undefined } });

        ext.outputChannel.appendLog(workCompleted);
    }
}
