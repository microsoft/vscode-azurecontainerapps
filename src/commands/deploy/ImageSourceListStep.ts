/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardExecuteStep, AzureWizardPromptStep, IAzureQuickPickItem, IWizardOptions } from "@microsoft/vscode-azext-utils";
import { ImageSource, ImageSourceValues } from "../../constants";
import { localize } from "../../utils/localize";
import { setQuickStartImage } from "../createContainerApp/setQuickStartImage";
import { ContainerRegistryListStep } from "./deployFromRegistry/ContainerRegistryListStep";
import { DeployFromRegistryConfigureStep } from "./deployFromRegistry/DeployFromRegistryConfigureStep";
import { EnvironmentVariablesListStep } from "./EnvironmentVariablesListStep";
import { IDeployBaseContext } from "./IDeployBaseContext";

interface ImageSourceOptions {
    useQuickStartImage?: boolean;
}
export class ImageSourceListStep extends AzureWizardPromptStep<IDeployBaseContext> {
    constructor(private readonly options?: ImageSourceOptions) {
        super();
    }

    public async prompt(context: IDeployBaseContext): Promise<void> {
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

    public shouldPrompt(context: IDeployBaseContext): boolean {
        return !context.imageSource;
    }

    public async getSubWizard(context: IDeployBaseContext): Promise<IWizardOptions<IDeployBaseContext> | undefined> {
        const promptSteps: AzureWizardPromptStep<IDeployBaseContext>[] = [];
        const executeSteps: AzureWizardExecuteStep<IDeployBaseContext>[] = [];

        switch (context.imageSource) {
            case ImageSource.QuickStartImage:
                setQuickStartImage(context);
                break;
            case ImageSource.ExternalRegistry:
                promptSteps.push(new ContainerRegistryListStep());
                executeSteps.push(new DeployFromRegistryConfigureStep());
                break;
            default:
            // Todo: Steps that lead to additional 'Build from project' options
        }

        promptSteps.push(new EnvironmentVariablesListStep());

        return { promptSteps, executeSteps };
    }
}
