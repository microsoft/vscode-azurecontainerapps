/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type Ingress } from "@azure/arm-appcontainers";
import { AzureWizardExecuteStepWithActivityOutput, nonNullProp } from "@microsoft/vscode-azext-utils";
import { type Progress } from "vscode";
import { localize } from "../../../utils/localize";
import { updateContainerApp } from "../../updateContainerApp";
import { type IngressBaseContext } from "../IngressContext";

export const enabledIngressDefaults = {
    transport: 'auto',
    allowInsecure: false,
    traffic: [
        {
            weight: 100,
            latestRevision: true
        }
    ],
};

export class EnableIngressStep<T extends IngressBaseContext> extends AzureWizardExecuteStepWithActivityOutput<T> {
    public priority: number = 750;
    public stepName: string = 'enableIngressStep';

    public async execute(context: T, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        progress.report({ message: localize('enablingIngress', 'Enabling ingress...') });

        const containerApp = nonNullProp(context, 'containerApp');
        const ingress: Ingress = {
            ...enabledIngressDefaults,
            ...containerApp.configuration?.ingress ?? {},
            targetPort: context.targetPort,
            external: context.enableExternal,
        }

        context.containerApp = await updateContainerApp(context, context.subscription, containerApp, { configuration: { ingress: ingress as Ingress | undefined } });
    }

    public shouldExecute(context: T): boolean {
        const hasNewVisiblity: boolean = context.enableExternal !== undefined && context.enableExternal !== context.containerApp?.configuration?.ingress?.external;
        const hasNewTargetPort: boolean = !!context.targetPort && context.targetPort !== context.containerApp?.configuration?.ingress?.targetPort;
        return context.enableIngress === true && hasNewVisiblity || hasNewTargetPort;
    }

    public getTreeItemLabel(context: T): string {
        const visibility: string = context.enableExternal ? localize('external', 'external') : localize('internal', 'internal');
        return localize('enableIngressLabel', 'Enable {0} ingress on port {1}', visibility, context.targetPort);
    }

    public getOutputLogSuccess(context: T): string {
        const visibility: string = context.enableExternal ? localize('external', 'external') : localize('internal', 'internal');
        return localize('enableSuccess', 'Successfully enabled {0} ingress on port {1}.', visibility, context.targetPort);
    }

    public getOutputLogFail(context: T): string {
        const visibility: string = context.enableExternal ? localize('external', 'external') : localize('internal', 'internal');
        return localize('enableFailed', 'Failed to enable {0} ingress on port {1}.', visibility, context.targetPort);
    }
}
