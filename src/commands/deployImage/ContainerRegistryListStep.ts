/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, IAzureQuickPickItem, IWizardOptions } from "vscode-azureextensionui";
import { acrDomain, dockerDomain, SupportedRegistries } from "../../constants";
import { localize } from "../../utils/localize";
import { AcrListStep } from "./acr/AcrListStep";
import { AcrRepositoriesListStep } from "./acr/AcrRepositoriesListStep";
import { AcrTagListStep } from "./acr/AcrTagListStep";
import { DockerContainerRepositoryListStep } from "./docker/DockerContainerRepositoryListStep";
import { DockerContainerTagListStep } from "./docker/DockerContainerTagListStep";
import { DockerNamespaceInputStep } from "./docker/DockerNamespaceInputStep";
import { IDeployImageContext } from "./IDeployImageContext";

export class ContainerRegistryListStep extends AzureWizardPromptStep<IDeployImageContext> {
    public hideStepCount: boolean = true;

    public async prompt(context: IDeployImageContext): Promise<void> {
        const placeHolder: string = localize('selectTag', 'Select a container registry');
        const picks: IAzureQuickPickItem<SupportedRegistries>[] = [{ label: 'Azure Container Registries', data: acrDomain }, { label: 'Docker Registry', data: dockerDomain }];
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
            promptSteps.push(new DockerNamespaceInputStep(), new DockerContainerRepositoryListStep(), new DockerContainerTagListStep())
        }

        return { promptSteps };
    }
}
