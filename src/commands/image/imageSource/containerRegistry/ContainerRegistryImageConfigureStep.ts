/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, type IWizardOptions } from "@microsoft/vscode-azext-utils";
import { getImageNameWithoutTag, parseImageName } from "../../../../utils/imageNameUtils";
import { IngressPromptStep } from "../../../ingress/IngressPromptStep";
import { type ContainerRegistryImageSourceContext } from "./ContainerRegistryImageSourceContext";
import { getLoginServer } from "./getLoginServer";

export class ContainerRegistryImageConfigureStep<T extends ContainerRegistryImageSourceContext> extends AzureWizardPromptStep<T> {
    public async configureBeforePrompt(context: T): Promise<void> {
        context.image ||= `${getLoginServer(context)}/${context.repositoryName}:${context.tag}`;

        const { registryName, registryDomain } = parseImageName(context.image);
        context.telemetry.properties.registryName = registryName;
        context.telemetry.properties.registryDomain = registryDomain ?? 'other';
    }

    public async prompt(): Promise<void> {
        // Don't prompt, just need to use the subwizard
    }

    public shouldPrompt(): boolean {
        return false;
    }

    public async getSubWizard(context: T): Promise<IWizardOptions<T> | undefined> {
        // If more than the image tag changed, prompt for ingress again
        if (getImageNameWithoutTag(context.containerApp?.template?.containers?.[0].image ?? '') !== getImageNameWithoutTag(context.image ?? '')) {
            return {
                promptSteps: [new IngressPromptStep()],
            };
        }

        return undefined;
    }
}
