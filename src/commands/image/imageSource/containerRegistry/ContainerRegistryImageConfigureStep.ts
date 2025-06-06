/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ActivityChildItem, ActivityChildType, activitySuccessContext, activitySuccessIcon, AzureWizardPromptStep, createContextValue, type IWizardOptions } from "@microsoft/vscode-azext-utils";
import { ext } from "../../../../extensionVariables";
import { getImageNameWithoutTag, parseImageName } from "../../../../utils/imageNameUtils";
import { localize } from "../../../../utils/localize";
import { IngressPromptStep } from "../../../ingress/IngressPromptStep";
import { type RevisionDraftContext } from "../../../revisionDraft/RevisionDraftContext";
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
            new ActivityChildItem({
                label: localize('configureTargetImageLabel', 'Configure target image "{0}"', context.image),
                description: '0s',
                contextValue: createContextValue(['containerRegistryImageConfigureStepItem', activitySuccessContext]),
                activityType: ActivityChildType.Success,
                iconPath: activitySuccessIcon,
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

    public async getSubWizard(context: T & Partial<RevisionDraftContext>): Promise<IWizardOptions<T> | undefined> {
        if (context.isDraftCommand) {
            // Skip any steps that would attempt to update the container app directly while running draft commands
            return undefined;
        }

        // If more than the image tag changed, prompt for ingress again
        const currentImage: string | undefined = context.template?.containers?.[context.containersIdx ?? 0].image ?? context.containerApp?.template?.containers?.[context.containersIdx ?? 0].image;
        if (getImageNameWithoutTag(currentImage ?? '') !== getImageNameWithoutTag(context.image ?? '')) {
            return {
                promptSteps: [new IngressPromptStep()],
            };
        }

        return undefined;
    }
}
