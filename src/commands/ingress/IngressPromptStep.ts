/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardExecuteStep, AzureWizardPromptStep, GenericTreeItem, IWizardOptions, createContextValue } from "@microsoft/vscode-azext-utils";
import { randomUUID } from "crypto";
import { ThemeColor, ThemeIcon } from "vscode";
import { activitySuccessContext } from "../../constants";
import { localize } from "../../utils/localize";
import type { IngressContext } from "./IngressContext";
import { DisableIngressStep } from "./disableIngress/DisableIngressStep";
import { TargetPortInputStep } from "./editTargetPort/TargetPortInputStep";
import { getDefaultPort } from "./editTargetPort/getDefaultPort";
import { EnableIngressStep } from "./enableIngress/EnableIngressStep";
import { IngressVisibilityStep } from "./enableIngress/IngressVisibilityStep";
import { getDockerfileExposePort } from "./getDockerfileExposePort";

export class IngressPromptStep extends AzureWizardPromptStep<IngressContext> {
    public async prompt(context: IngressContext): Promise<void> {
        context.enableIngress = (await context.ui.showQuickPick([{ label: localize('enable', 'Enable'), data: true }, { label: localize('disable', 'Disable'), data: false }],
            { placeHolder: localize('enableIngress', 'Enable ingress for applications that need an HTTP endpoint.') })).data;
    }

    // If a Dockerfile is being used for deployment, we may be able to use its values to preconfigure and skip prompting ingress settings
    public async configureBeforePrompt(context: IngressContext): Promise<void> {
        if (!context.dockerfilePath) {
            return;
        }

        context.dockerfileExposePorts = await getDockerfileExposePort(context.dockerfilePath);

        if (context.alwaysPromptIngress) {
            return;
        }

        if (!context.dockerfileExposePorts) {
            context.enableIngress = false;
            context.enableExternal = false;
        } else if (context.dockerfileExposePorts) {
            context.enableIngress = true;
            context.enableExternal = true;
            context.targetPort = getDefaultPort(context);
        }

        if (context.activityChildren) {
            context.activityChildren.push(
                new GenericTreeItem(undefined, {
                    contextValue: createContextValue(['ingressPromptStep', activitySuccessContext, randomUUID()]),
                    label: context.enableIngress ?
                        localize('ingressEnabledLabel', 'Enable ingress on port {0} (found Dockerfile configuration)', context.targetPort) :
                        localize('ingressDisabledLabel', 'Disable ingress (found Dockerfile configuration)'),
                    iconPath: new ThemeIcon('pass', new ThemeColor('testing.iconPassed'))
                })
            );
        }
    }

    public shouldPrompt(context: IngressContext): boolean {
        return context.enableIngress === undefined;
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

        return { promptSteps, executeSteps };
    }
}
