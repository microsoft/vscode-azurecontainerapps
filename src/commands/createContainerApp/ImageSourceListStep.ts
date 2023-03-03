/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, IAzureQuickPickItem, IWizardOptions } from "@microsoft/vscode-azext-utils";
import { ImageSource, ImageSourceValues } from "../../constants";
import { localize } from "../../utils/localize";
import { ContainerRegistryListStep } from "../deployImage/ContainerRegistryListStep";
import { EnvironmentVariablesListStep } from "./EnvironmentVariablesListStep";
import { IContainerAppContext } from './IContainerAppContext';
import { setQuickStartImage } from "./setQuickStartImage";

interface ImageSourceOptions {
    useQuickStartImage?: boolean;
}
export class ImageSourceListStep extends AzureWizardPromptStep<IContainerAppContext> {
    constructor(private readonly options?: ImageSourceOptions) {
        super();
    }

    public async prompt(context: IContainerAppContext): Promise<void> {
        const imageSourceLabels: string[] = [
            localize('externalRegistry', 'Use existing image'),
            localize('quickStartImage', 'Use quickstart image'),
            localize('updateImage', 'Update image in Container App')
            // localize('buildFromProject', 'Build from project'),
        ];

        const placeHolder: string = localize('imageBuildSourcePrompt', 'Select an image source for the container app');
        const picks: IAzureQuickPickItem<ImageSourceValues | undefined>[] = [
            { label: imageSourceLabels[0], data: ImageSource.ExternalRegistry, suppressPersistence: true },
            // { label: imageSourceLabels[2], data: undefined, suppressPersistence: true },
        ];

        if (this.options?.useQuickStartImage) {
            picks.unshift({ label: imageSourceLabels[1], data: ImageSource.QuickStartImage, suppressPersistence: true });
        } else {
            if (context.targetContainer?.template?.containers?.[0]?.image) {
                picks.push({ label: imageSourceLabels[2], data: ImageSource.ExternalRegistry, suppressPersistence: true });
            }
        }

        context.imageSource = (await context.ui.showQuickPick(picks, { placeHolder })).data;
    }

    public shouldPrompt(context: IContainerAppContext): boolean {
        return !context.imageSource;
    }

    public async getSubWizard(context: IContainerAppContext): Promise<IWizardOptions<IContainerAppContext> | undefined> {
        const promptSteps: AzureWizardPromptStep<IContainerAppContext>[] = [];

        switch (context.imageSource) {
            case ImageSource.QuickStartImage:
                setQuickStartImage(context);
                break;
            case ImageSource.ExternalRegistry:
                promptSteps.push(new ContainerRegistryListStep(), new EnvironmentVariablesListStep());
                break;
            default:
            // Todo: Steps that lead to additional 'Build from project' options
        }

        return { promptSteps };
    }
}
