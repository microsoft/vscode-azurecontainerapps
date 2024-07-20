/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, UserCancelledError, type AzureWizardExecuteStep, type IAzureQuickPickItem, type IWizardOptions } from "@microsoft/vscode-azext-utils";
import { env, UIKind, workspace } from "vscode";
import { ImageSource } from "../../../constants";
import { localize } from "../../../utils/localize";
import { deployWorkspaceProjectApi } from "../../api/deployWorkspaceProjectApi";
import type * as api from "../../api/vscode-azurecontainerapps.api";
import { type CreateContainerAppContext } from "../../createContainerApp/CreateContainerAppContext";
import { createContainerAppCommandId } from "../../createContainerApp/createContainerApp";
import { setQuickStartImage } from "../../createContainerApp/setQuickStartImage";
import { EnvironmentVariablesListStep } from "./EnvironmentVariablesListStep";
import { type ImageSourceContext } from "./ImageSourceContext";
import { BuildImageStep } from "./buildImageInAzure/BuildImageStep";
import { DockerfileItemStep } from "./buildImageInAzure/DockerfileItemStep";
import { ImageNameStep } from "./buildImageInAzure/ImageNameStep";
import { OSPickStep } from "./buildImageInAzure/OSPickStep";
import { RootFolderStep } from "./buildImageInAzure/RootFolderStep";
import { RunStep } from "./buildImageInAzure/RunStep";
import { SourcePathStep } from "./buildImageInAzure/SourcePathStep";
import { TarFileStep } from "./buildImageInAzure/TarFileStep";
import { UploadSourceCodeStep } from "./buildImageInAzure/UploadSourceCodeStep";
import { ContainerRegistryImageConfigureStep } from "./containerRegistry/ContainerRegistryImageConfigureStep";
import { ContainerRegistryListStep } from "./containerRegistry/ContainerRegistryListStep";
import { AcrListStep } from "./containerRegistry/acr/AcrListStep";

export class ImageSourceListStep extends AzureWizardPromptStep<ImageSourceContext> {
    public async prompt(context: ImageSourceContext): Promise<void> {
        const imageSourceLabels: string[] = [
            localize('containerRegistryLabel', 'Container Registry'),
            localize('quickstartImageLabel', 'Quickstart'),
            localize('workspaceProjectLabel', 'Workspace Project'),
        ];

        const imageSourceDetails: string[] = [
            localize('containerRegistryDetails', 'Use an image from Azure Container Registry or other third party container registry'),
            localize('quickstartImageDetails', 'Use our default starter image to quickly get a sample app up and running'),
            localize('workspaceProjectDetails', 'Build an image starting from a local workspace project with Dockerfile'),
        ];

        const placeHolder: string = localize('imageBuildSourcePrompt', 'Select an image source for the container app');
        const picks: IAzureQuickPickItem<ImageSource | undefined>[] = [
            { label: imageSourceLabels[0], detail: imageSourceDetails[0], data: ImageSource.ContainerRegistry, suppressPersistence: true }
        ];

        if (context.showQuickStartImage) {
            picks.unshift({ label: imageSourceLabels[1], detail: imageSourceDetails[1], data: ImageSource.QuickstartImage, suppressPersistence: true });
        }

        const isVirtualWorkspace = workspace.workspaceFolders && workspace.workspaceFolders.every(f => f.uri.scheme !== 'file');
        if (env.uiKind === UIKind.Desktop && !isVirtualWorkspace) {
            picks.push({ label: imageSourceLabels[2], detail: imageSourceDetails[2], data: ImageSource.RemoteAcrBuild, suppressPersistence: true })
        }

        context.imageSource = (await context.ui.showQuickPick(picks, { placeHolder })).data;
    }

    public shouldPrompt(context: ImageSourceContext): boolean {
        return !context.imageSource;
    }

    public async getSubWizard(context: ImageSourceContext): Promise<IWizardOptions<ImageSourceContext> | undefined> {
        const promptSteps: AzureWizardPromptStep<ImageSourceContext>[] = [];
        const executeSteps: AzureWizardExecuteStep<ImageSourceContext>[] = [];

        switch (context.imageSource) {
            case ImageSource.QuickstartImage:
                setQuickStartImage(context);
                context.telemetry.properties.imageSource = ImageSource.QuickstartImage;
                break;
            case ImageSource.ContainerRegistry:
                promptSteps.push(new ContainerRegistryListStep());
                executeSteps.push(new ContainerRegistryImageConfigureStep());
                context.telemetry.properties.imageSource = ImageSource.ContainerRegistry;
                break;
            case ImageSource.RemoteAcrBuild:
                if (context.issuerCommandId === createContainerAppCommandId) {
                    await callDeployWorkspaceProjectApi(context);
                }
                promptSteps.push(new RootFolderStep(), new DockerfileItemStep(), new SourcePathStep(), new AcrListStep(), new ImageNameStep(), new OSPickStep());
                executeSteps.push(new TarFileStep(), new UploadSourceCodeStep(), new RunStep(), new BuildImageStep(), new ContainerRegistryImageConfigureStep());
                context.telemetry.properties.imageSource = ImageSource.RemoteAcrBuild;
                break;
            default:
        }

        promptSteps.push(new EnvironmentVariablesListStep());
        return { promptSteps, executeSteps };
    }
}

async function callDeployWorkspaceProjectApi(context: CreateContainerAppContext): Promise<void> {
    const apiOptions: api.DeployWorkspaceProjectOptionsContract = {
        environmentId: context.managedEnvironmentId,
        newContainerAppName: context.newContainerAppName,
        suppressConfirmation: true,
        suppressActivity: false,
    };

    void deployWorkspaceProjectApi(apiOptions);
    throw new UserCancelledError();
}
