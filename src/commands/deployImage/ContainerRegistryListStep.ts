/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, IAzureQuickPickItem, IWizardOptions } from "@microsoft/vscode-azext-utils";
import { acrDomain, dockerHubDomain, SupportedRegistries } from "../../constants";
import { localize } from "../../utils/localize";
import { AcrListStep } from "./acr/AcrListStep";
import { AcrRepositoriesListStep } from "./acr/AcrRepositoriesListStep";
import { AcrTagListStep } from "./acr/AcrTagListStep";
import { DockerHubContainerRepositoryListStep } from "./dockerHub/DockerHubContainerRepositoryListStep";
import { DockerHubContainerTagListStep } from "./dockerHub/DockerHubContainerTagListStep";
import { DockerHubNamespaceInputStep } from "./dockerHub/DockerHubNamespaceInputStep";
import { IDeployImageContext } from "./IDeployImageContext";
import { RegistryImageInputStep } from "./RegistryImageInputStep";

export class ContainerRegistryListStep extends AzureWizardPromptStep<IDeployImageContext> {
    public hideStepCount: boolean = true;

    public async prompt(context: IDeployImageContext): Promise<void> {
        const placeHolder: string = localize('selectTag', 'Select a container registry');
        const picks: IAzureQuickPickItem<SupportedRegistries | undefined>[] = [
            { label: 'Azure Container Registries', data: acrDomain },
            { label: 'Docker Hub Registry', data: dockerHubDomain },
            { label: localize('otherPublicRegistry', 'Other public registry'), data: undefined }
        ];

        context.registryDomain = (await context.ui.showQuickPick(picks, { placeHolder })).data;
    }

    public shouldPrompt(context: IDeployImageContext): boolean {
        return !context.tag && !context.image;
    }

    public async getSubWizard(context: IDeployImageContext): Promise<IWizardOptions<IDeployImageContext> | undefined> {
        if (context.image) {
            return undefined;
        }

        const promptSteps: AzureWizardPromptStep<IDeployImageContext>[] = [];
        switch (context.registryDomain) {
            case acrDomain:
                promptSteps.push(new AcrListStep(), new AcrRepositoriesListStep(), new AcrTagListStep());
                break;
            case dockerHubDomain:
                promptSteps.push(new DockerHubNamespaceInputStep(), new DockerHubContainerRepositoryListStep(), new DockerHubContainerTagListStep());
                break;
            default:
                promptSteps.push(new RegistryImageInputStep());
        }

        return { promptSteps };
    }
}
