/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, IAzureQuickPickItem, IWizardOptions, openUrl } from "@microsoft/vscode-azext-utils";
import { ImageSource, ImageSourceValues, quickStartImageName } from "../../constants";
import { localize } from "../../utils/localize";
import { ContainerRegistryListStep } from "../deployImage/ContainerRegistryListStep";
import { EnvironmentVariablesListStep } from "./EnvironmentVariablesListStep";
import { IContainerAppContext } from './IContainerAppContext';

export class ImageSourceListStep extends AzureWizardPromptStep<IContainerAppContext> {
    public async prompt(context: IContainerAppContext): Promise<void> {
        const imageSourceLabels: string[] = [
            'Quick Start',
            'Registry'
        ];
        const imageSourceInfo: string = localize('imageSourceInfo', '$(link-external)  Learn more about the different image source options');

        const placeHolder: string = localize('imageBuildSourcePrompt', 'Choose an image source for the container app.');
        const picks: IAzureQuickPickItem<ImageSourceValues | undefined>[] = [
            { label: imageSourceLabels[0], data: ImageSource.QuickStart, description: quickStartImageName, suppressPersistence: true },
            { label: imageSourceLabels[1], data: ImageSource.Registry, description: 'Azure Container Registry, Docker Hub, etc.', suppressPersistence: true },
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
            case ImageSource.QuickStart:
                // Todo: @mmott
                break;
            case ImageSource.Registry:
                promptSteps.push(new ContainerRegistryListStep(), new EnvironmentVariablesListStep());
                break;
            case ImageSource.LocalDocker:
                // Todo: Migrate or leverage from Docker Ext.
                break;
            case ImageSource.AcrDocker:
                // Todo: Migrate or leverage from Docker Ext.
                break;
            default:
        }

        return { promptSteps };
    }
}
