/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, IAzureQuickPickItem, IWizardOptions } from "vscode-azureextensionui";
import { acrDomain, dockerHubDomain, SupportedRegistries } from "../../constants";
import { localize } from "../../utils/localize";
import { AcrListStep } from "./acr/AcrListStep";
import { AcrRepositoriesListStep } from "./acr/AcrRepositoriesListStep";
import { AcrTagListStep } from "./acr/AcrTagListStep";
import { DockerHubContainerRepositoryListStep } from "./dockerHub/DockerHubContainerRepositoryListStep";
import { DockerHubContainerTagListStep } from "./dockerHub/DockerHubContainerTagListStep";
import { DockerHubNamespaceInputStep } from "./dockerHub/DockerHubNamespaceInputStep";
import { IDeployImageContext } from "./IDeployImageContext";

export class ContainerRegistryListStep extends AzureWizardPromptStep<IDeployImageContext> {
    public hideStepCount: boolean = true;

    public async prompt(context: IDeployImageContext): Promise<void> {
        const placeHolder: string = localize('selectTag', 'Select a container registry');
        const picks: IAzureQuickPickItem<SupportedRegistries>[] = [{ label: 'Azure Container Registries', data: acrDomain }, { label: 'Docker Hub Registry', data: dockerHubDomain }];
        context.registryDomain = (await context.ui.showQuickPick(picks, { placeHolder })).data;
    }

    public shouldPrompt(context: IDeployImageContext): boolean {
        return !context.tag;
    }

    public async getSubWizard(context: IDeployImageContext): Promise<IWizardOptions<IDeployImageContext>> {
        const promptSteps: AzureWizardPromptStep<IDeployImageContext>[] = [];
        if (context.registryDomain === acrDomain) {
            promptSteps.push(new AcrListStep(), new AcrRepositoriesListStep(), new AcrTagListStep())
        } else {
            promptSteps.push(new DockerHubNamespaceInputStep(), new DockerHubContainerRepositoryListStep(), new DockerHubContainerTagListStep())
        }

        return { promptSteps };
    }
}
