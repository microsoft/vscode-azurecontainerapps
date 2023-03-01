/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/
import { ContainerApp } from "@azure/arm-appcontainers";
import { AzureWizard, AzureWizardPromptStep, IAzureQuickPickItem, IWizardOptions } from "@microsoft/vscode-azext-utils";
import { ImageSource, ImageSourceValues } from "../../constants";
import { ContainerAppItem } from "../../tree/ContainerAppItem";
import { localize } from "../../utils/localize";
import { pickContainerApp } from "../../utils/pickContainerApp";
import { IContainerAppContext } from "../createContainerApp/IContainerAppContext";
import { IDeployImageContext } from "./IDeployImageContext";

export async function deployContainerApp(context: IDeployImageContext): Promise<void> {
    const wizardContext: IDeployImageContext = context;
    const wizard: AzureWizard<IDeployImageContext> = new AzureWizard(wizardContext, {
        promptSteps: [new deploy()]
    });
    await wizard.prompt();
}

export class deploy extends AzureWizardPromptStep<IContainerAppContext> {
    public async prompt(context: IDeployImageContext): Promise<void> {
        const deployMethodLabels: string[] = [
            localize('deployFromImage', 'Deploy from locally built image'),
            localize('deployFromACR', 'Deploy and build image with Azure Container Registry'),
            localize('deployFromDocker', 'Deploy and build image with Docker Hub')
        ];

        const placeHolder: string = localize('deployPrompt', 'Select a deployment method');
        const picks: IAzureQuickPickItem<ImageSourceValues | undefined>[] = [
            { label: deployMethodLabels[0], data: ImageSource.ExternalRegistry, suppressPersistence: true },
            { label: deployMethodLabels[1], data: ImageSource.RemoteAcrBuild, suppressPersistence: true },
            { label: deployMethodLabels[2], data: ImageSource.LocalDockerBuild, suppressPersistence: true }
        ];

        context.deployMethod = (await context.ui.showQuickPick(picks, { placeHolder })).data;
    }
    public shouldPrompt(): boolean {
        return true;
    }

    public async getSubWizard(context: IDeployImageContext): Promise<IWizardOptions<IDeployImageContext> | undefined> {
        const promptSteps: AzureWizardPromptStep<IDeployImageContext>[] = [];

        context.targetContainer = await getContainerApp(context);
        //to do: add capabilities for creating a new container app at deployment

        switch (context.deployMethod) {
            case ImageSource.RemoteAcrBuild:
                //todo: add implementation for remote acr build
                break;
            case ImageSource.LocalDockerBuild:
                //todo: add implementation for local docker build
                break;
            default:
            //to do: implement the hookup to deploy image
        }

        return { promptSteps };
    }
}

async function getContainerApp(context: IDeployImageContext, node?: ContainerAppItem): Promise<ContainerApp> {
    node ??= await pickContainerApp(context, {
        title: localize('deployContainerApp', 'Deploy to Container App'),
    });

    return node.containerApp;
}
