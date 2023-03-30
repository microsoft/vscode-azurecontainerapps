/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardExecuteStep, AzureWizardPromptStep, IAzureQuickPickItem, IWizardOptions } from "@microsoft/vscode-azext-utils";
import { UIKind, env, workspace } from "vscode";
import { ImageSource, ImageSourceValues } from "../../constants";
import { localize } from "../../utils/localize";
import { setQuickStartImage } from "../createContainerApp/setQuickStartImage";
import { EnvironmentVariablesListStep } from "./EnvironmentVariablesListStep";
import { IImageSourceBaseContext } from "./IImageSourceBaseContext";
import { BuildFromProjectListStep } from "./buildImageInAzure/BuildFromProjectListStep";
import { ContainerRegistryImageConfigureStep } from "./containerRegistry/ContainerRegistryImageConfigureStep";
import { ContainerRegistryListStep } from "./containerRegistry/ContainerRegistryListStep";

export class ImageSourceListStep extends AzureWizardPromptStep<IImageSourceBaseContext> {
    public async prompt(context: IImageSourceBaseContext): Promise<void> {
        const imageSourceLabels: string[] = [
            localize('containerRegistry', 'Use image from registry'),
            localize('quickStartImage', 'Use quickstart image'),
            localize('buildFromProject', 'Build from project remotely using Azure Container Registry'),
        ];

        const placeHolder: string = localize('imageBuildSourcePrompt', 'Select an image source for the container app');
        const picks: IAzureQuickPickItem<ImageSourceValues | undefined>[] = [
            { label: imageSourceLabels[0], data: ImageSource.ContainerRegistry, suppressPersistence: true }
        ];

        if (context.showQuickStartImage) {
            picks.unshift({ label: imageSourceLabels[1], data: ImageSource.QuickStartImage, suppressPersistence: true });
        }

        const isVirtualWorkspace = workspace.workspaceFolders && workspace.workspaceFolders.every(f => f.uri.scheme !== 'file');
        if (env.uiKind === UIKind.Desktop && !isVirtualWorkspace) {
            picks.push({ label: imageSourceLabels[2], data: ImageSource.RemoteAcrBuild, suppressPersistence: true })
        }

        context.imageSource = (await context.ui.showQuickPick(picks, { placeHolder })).data;
    }

    public shouldPrompt(context: IImageSourceBaseContext): boolean {
        return !context.imageSource;
    }

    public async getSubWizard(context: IImageSourceBaseContext): Promise<IWizardOptions<IImageSourceBaseContext> | undefined> {
        const promptSteps: AzureWizardPromptStep<IImageSourceBaseContext>[] = [];
        const executeSteps: AzureWizardExecuteStep<IImageSourceBaseContext>[] = [];

        switch (context.imageSource) {
            case ImageSource.QuickStartImage:
                setQuickStartImage(context);
                break;
            case ImageSource.ContainerRegistry:
                promptSteps.push(new ContainerRegistryListStep());
                executeSteps.push(new ContainerRegistryImageConfigureStep());
                break;
            case ImageSource.RemoteAcrBuild:
                promptSteps.push(new BuildFromProjectListStep());
                executeSteps.push(new ContainerRegistryImageConfigureStep());
                break;
            default:
        }

        promptSteps.push(new EnvironmentVariablesListStep());

        return { promptSteps, executeSteps };
    }
}
