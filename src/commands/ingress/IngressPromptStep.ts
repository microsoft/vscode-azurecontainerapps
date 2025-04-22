/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, type AzureWizardExecuteStep, type IWizardOptions } from "@microsoft/vscode-azext-utils";
import { ext } from "../../extensionVariables";
import { localize } from "../../utils/localize";
import { type IngressContext } from "./IngressContext";
import { DisableIngressStep } from "./disableIngress/DisableIngressStep";
import { TargetPortInputStep } from "./editTargetPort/TargetPortInputStep";
import { getDefaultPort } from "./editTargetPort/getDefaultPort";
import { EnableIngressStep } from "./enableIngress/EnableIngressStep";
import { IngressVisibilityStep } from "./enableIngress/IngressVisibilityStep";
import { tryGetDockerfileExposePorts } from "./tryGetDockerfileExposePorts";

export class IngressPromptStep extends AzureWizardPromptStep<IngressContext> {
    public async prompt(context: IngressContext): Promise<void> {
        context.enableIngress = (await context.ui.showQuickPick([{ label: localize('enable', 'Enable'), data: true }, { label: localize('disable', 'Disable'), data: false }],
            { placeHolder: localize('enableIngress', 'Enable ingress for applications that need an HTTP endpoint.') })).data;
    }

    public async configureBeforePrompt(context: IngressContext): Promise<void> {
        await tryConfigureIngressUsingDockerfile(context);
    }

    public shouldPrompt(context: IngressContext): boolean {
        return context.enableIngress === undefined;
    }

    public confirmationViewProperties(context: IngressContext): { name: string; value: string; valueInContext: string } {
        return {
            name: localize('enableIngress', 'Ingress'),
            value: context.enableIngress ? localize('enabled', 'Enabled') : localize('disabled', 'Disabled'),
            valueInContext: 'enableIngress'
        };
    }

    public async getSubWizard(context: IngressContext): Promise<IWizardOptions<IngressContext> | undefined> {
        const promptSteps: AzureWizardPromptStep<IngressContext>[] = [];
        const executeSteps: AzureWizardExecuteStep<IngressContext>[] = [];

        if (context.enableIngress) {
            promptSteps.push(new IngressVisibilityStep(), new TargetPortInputStep());
        }

        // Execute steps for amending existing container apps; skip if not yet created
        if (context.containerApp) {
            executeSteps.push(context.enableIngress ? new EnableIngressStep() : new DisableIngressStep());
        }

        context.telemetry.properties.enableIngress = context.enableIngress ? 'true' : 'false';

        return { promptSteps, executeSteps };
    }
}

export async function tryConfigureIngressUsingDockerfile(context: IngressContext): Promise<void> {
    if (!context.dockerfilePath) {
        return;
    }

    context.dockerfileExposePorts = await tryGetDockerfileExposePorts(context.dockerfilePath);
    context.telemetry.properties.dockerfileExposePortRangeCount = context.dockerfileExposePorts ? String(context.dockerfileExposePorts.length) : '0';

    if (context.alwaysPromptIngress) {
        return;
    }

    if (context.dockerfileExposePorts) {
        context.enableIngress = true;
        context.enableExternal = context.containerApp?.configuration?.ingress?.external ?? true;
        context.targetPort = getDefaultPort(context);
    } else {
        context.enableIngress = false;
        context.enableExternal = false;
    }

    const currentExternalEnabled: boolean | undefined = context.containerApp?.configuration?.ingress?.external;
    const currentTargetPort: number | undefined = context.containerApp?.configuration?.ingress?.targetPort;
    if (currentExternalEnabled === context.enableExternal && currentTargetPort === context.targetPort) {
        return;
    }

    ext.outputChannel.appendLog(context.enableIngress ?
        localize('ingressEnabledLabel', 'Detected ingress on port {0} using Dockerfile configuration.', context.targetPort) :
        localize('ingressDisabledLabel', 'Detected no ingress using Dockerfile configuration.')
    );
}
