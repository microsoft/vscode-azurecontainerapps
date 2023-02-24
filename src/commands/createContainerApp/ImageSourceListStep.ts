/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, IAzureQuickPickItem, IWizardOptions, openUrl } from "@microsoft/vscode-azext-utils";
import { ImageSource, ImageSourceValues } from "../../constants";
import { localize } from "../../utils/localize";
import { ContainerRegistryListStep } from "../deployImage/ContainerRegistryListStep";
import { EnvironmentVariablesListStep } from "./EnvironmentVariablesListStep";
import { IContainerAppContext } from './IContainerAppContext';

export class ImageSourceListStep extends AzureWizardPromptStep<IContainerAppContext> {
    public async prompt(context: IContainerAppContext): Promise<void> {
        const imageSourceLabels: string[] = [
            localize('quickStartImage', 'Quick Start Image'),
            localize('externalRegistry', 'External Registry'),
            localize('localDockerBuild', 'Local Docker Build'),
            localize('azureRemoteBuild', 'Azure Registry Build')
        ];
        const imageSourceDescriptions: string[] = [
            localize('quickStartDesc', 'Default image choice for fast setup'),
            localize('externalRegistryDesc', 'Use an existing image stored in a registry'),
            localize('localDockerBuildDesc', 'Build image from project locally using Docker'),
            localize('azureRemoteBuildDesc', 'Build image from project remotely using Azure')
        ];
        const imageSourceInfo: string = localize('imageSourceInfo', '$(link-external)  Learn more about the different image source options');

        const placeHolder: string = localize('imageBuildSourcePrompt', 'Choose an image source for the container app');
        const picks: IAzureQuickPickItem<ImageSourceValues | undefined>[] = [
            { label: imageSourceLabels[0], description: imageSourceDescriptions[0], data: ImageSource.QuickStartImage,  suppressPersistence: true },
            { label: imageSourceLabels[1], description: imageSourceDescriptions[1], data: ImageSource.ExternalRegistry, suppressPersistence: true },
            { label: imageSourceLabels[2], description: imageSourceDescriptions[2], data: ImageSource.LocalDockerBuild, suppressPersistence: true },
            { label: imageSourceLabels[3], description: imageSourceDescriptions[3], data: ImageSource.RemoteAcrBuild, suppressPersistence: true},
            { label: imageSourceInfo, data: undefined, suppressPersistence: true }
        ]

        let pick: ImageSourceValues | undefined;
        while (!pick) {
            pick = (await context.ui.showQuickPick(picks, { placeHolder })).data;
            if (!pick) {
                // Todo: add wiki url and populate info...
                await openUrl('https://aka.ms/');
            }
        }
        context.imageSource = pick;
    }

    public shouldPrompt(context: IContainerAppContext): boolean {
        return !context.imageSource;
    }

    public async getSubWizard(context: IContainerAppContext): Promise<IWizardOptions<IContainerAppContext> | undefined> {
        const promptSteps: AzureWizardPromptStep<IContainerAppContext>[] = [];
        switch (context.imageSource) {
            case ImageSource.QuickStartImage:
                // Todo: @mmott
            case ImageSource.ExternalRegistry:
                promptSteps.push(new ContainerRegistryListStep(), new EnvironmentVariablesListStep());
                break;
            case ImageSource.LocalDockerBuild:
                // Todo: Migrate or leverage from Docker Ext.
                break;
            case ImageSource.RemoteAcrBuild:
                // Todo: Migrate or leverage from Docker Ext.
                break;
            default:
        }

        return { promptSteps };
    }
}
