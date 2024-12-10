/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type Ingress } from "@azure/arm-appcontainers";
import { AzureWizardExecuteStep, GenericParentTreeItem, GenericTreeItem, activityFailContext, activityFailIcon, activitySuccessContext, activitySuccessIcon, createUniversallyUniqueContextValue, nonNullProp, type ExecuteActivityOutput } from "@microsoft/vscode-azext-utils";
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

export class EnableIngressStep extends AzureWizardExecuteStep<IngressBaseContext> {
    public priority: number = 750;

    public async execute(context: IngressBaseContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
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

    public shouldExecute(context: IngressBaseContext): boolean {
        const hasNewVisiblity: boolean = context.enableExternal !== undefined && context.enableExternal !== context.containerApp?.configuration?.ingress?.external;
        const hasNewTargetPort: boolean = !!context.targetPort && context.targetPort !== context.containerApp?.configuration?.ingress?.targetPort;
        return context.enableIngress === true && hasNewVisiblity || hasNewTargetPort;
    }

    public static createSuccessOutput(context: IngressBaseContext): ExecuteActivityOutput {
        const visibility: string = context.enableExternal ? localize('external', 'external') : localize('internal', 'internal');
        return {
            item: new GenericTreeItem(undefined, {
                contextValue: createUniversallyUniqueContextValue(['enableIngressStepSuccessItem', activitySuccessContext]),
                label: localize('enableIngressLabel', 'Enable {0} ingress on port {1}', visibility, context.targetPort),
                iconPath: activitySuccessIcon
            }),
            message: localize('enableCompleted', 'Enabled {0} ingress on port {1}.', visibility, context.targetPort)
        };
    }

    public createSuccessOutput(context: IngressBaseContext): ExecuteActivityOutput {
        return EnableIngressStep.createSuccessOutput(context);
    }

    public createFailOutput(context: IngressBaseContext): ExecuteActivityOutput {
        const visibility: string = context.enableExternal ? localize('external', 'external') : localize('internal', 'internal');
        return {
            item: new GenericParentTreeItem(undefined, {
                contextValue: createUniversallyUniqueContextValue(['enableIngressStepFailItem', activityFailContext]),
                label: localize('enableIngressLabel', 'Enable {0} ingress on port {1}', visibility, context.targetPort),
                iconPath: activityFailIcon
            }),
            message: localize('enableIngressFailed', 'Failed to enable {0} ingress on port {1}.', visibility, context.targetPort)
        };
    }
}
