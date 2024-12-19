/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { activitySuccessContext, activitySuccessIcon, AzureWizardPromptStep, createUniversallyUniqueContextValue, GenericTreeItem, type IWizardOptions } from "@microsoft/vscode-azext-utils";
import { ext } from "../../../../extensionVariables";
import { getImageNameWithoutTag, parseImageName } from "../../../../utils/imageNameUtils";
import { localize } from "../../../../utils/localize";
import { IngressPromptStep } from "../../../ingress/IngressPromptStep";
import { type ContainerRegistryImageSourceContext } from "./ContainerRegistryImageSourceContext";
import { getLoginServer } from "./getLoginServer";

export class ContainerRegistryImageConfigureStep<T extends ContainerRegistryImageSourceContext> extends AzureWizardPromptStep<T> {
    public async configureBeforePrompt(context: T): Promise<void> {
        context.image ||= `${getLoginServer(context)}/${context.repositoryName}:${context.tag}`;

        const { registryName, registryDomain } = parseImageName(context.image);
        context.telemetry.properties.registryName = registryName;
        context.telemetry.properties.registryDomain = registryDomain ?? 'other';

        // Output logs
        context.activityChildren?.push(
            new GenericTreeItem(undefined, {
                contextValue: createUniversallyUniqueContextValue(['containerRegistryImageConfigureStepItem', activitySuccessContext]),
                label: localize('configureTargetImageLabel', 'Configure target image "{0}"', context.image),
                iconPath: activitySuccessIcon
            })
        );
        ext.outputChannel.appendLog(localize('configureTargetImageMessage', 'Configured target image "{0}".', context.image));
    }

    public async prompt(): Promise<void> {
        // Don't prompt, just need to use the subwizard
    }

    public shouldPrompt(): boolean {
        return false;
    }

    public async getSubWizard(context: T): Promise<IWizardOptions<T> | undefined> {
        // If more than the image tag changed, prompt for ingress again
        if (getImageNameWithoutTag(context.containerApp?.template?.containers?.[context.containersIdx ?? 0].image ?? '') !== getImageNameWithoutTag(context.image ?? '')) {
            return {
                promptSteps: [new IngressPromptStep()],
            };
        }
        return undefined;
    }
}
