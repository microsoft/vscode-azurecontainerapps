/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureWizardExecuteStep, AzureWizardPromptStep, IAzureQuickPickItem, IWizardOptions } from "@microsoft/vscode-azext-utils";
import { buildImageInAzure } from "../../../constants";
import { localize } from "../../../utils/localize";
import { IDeployBaseContext } from "../IDeployBaseContext";
import { AcrListStep } from "../deployFromRegistry/acr/AcrListStep";
import { BuildImageStep } from "./BuildImageStep";
import { DockerFileItemStep } from "./DockerFileItemStep";
import { IBuildImageInAzureContext } from "./IBuildImageInAzureContext";
import { ImageNameStep } from "./ImageNameStep";
import { OSPickStep } from "./OSPickStep";
import { RootFolderStep } from "./RootFolderStep";
import { RunStep } from "./RunStep";
import { TarFileStep } from "./TarFileStep";
import { UploadSourceCodeStep } from "./UploadSourceCodeStep";

export class BuildFromProjectListStep extends AzureWizardPromptStep<IDeployBaseContext> {
    public async prompt(context: IDeployBaseContext): Promise<void> {
        const buildFromProjectLabels: string[] = [
            localize('azure', 'Build from project remotely using Azure')
            //localize('docker', 'Build from project locally using Docker')
        ];

        if (buildFromProjectLabels.length === 1) {
            context.buildType = buildImageInAzure;
        } else {
            const placeHolder: string = localize('buildType', 'Select how you want to build your project');
            const picks: IAzureQuickPickItem<string | undefined>[] = [
                { label: buildFromProjectLabels[0], data: buildImageInAzure, suppressPersistence: true },
                //{ label: buildFromProjectLabels[1], data: buildFromProjectLabels[1], suppressPersistence: true }
            ];

            context.buildType = (await context.ui.showQuickPick(picks, { placeHolder })).data;
        }
    }

    public shouldPrompt(context: IDeployBaseContext): boolean {
        return !context.buildType;
    }

    public async getSubWizard(context: IBuildImageInAzureContext): Promise<IWizardOptions<IDeployBaseContext> | undefined> {
        const promptSteps: AzureWizardPromptStep<IDeployBaseContext>[] = [];
        const executeSteps: AzureWizardExecuteStep<IDeployBaseContext>[] = [];

        switch (context.buildType) {
            case buildImageInAzure:
                promptSteps.push(new AcrListStep(), new RootFolderStep(), new DockerFileItemStep(), new ImageNameStep(), new OSPickStep());
                executeSteps.push(new TarFileStep(), new UploadSourceCodeStep(), new RunStep(), new BuildImageStep());
                break;
            //TODO: case for 'Build from project locally using Docker'
        }
        return { promptSteps, executeSteps };
    }
}
