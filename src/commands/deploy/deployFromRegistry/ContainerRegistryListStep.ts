/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, IAzureQuickPickItem, IWizardOptions } from "@microsoft/vscode-azext-utils";
import { SupportedRegistries, acrDomain, dockerHubDomain } from "../../../constants";
import { localize } from "../../../utils/localize";
import { IDeployFromRegistryContext } from "./IDeployFromRegistryContext";
import { RegistryImageInputStep } from "./RegistryImageInputStep";
import { AcrListStep } from "./acr/AcrListStep";
import { AcrRepositoriesListStep } from "./acr/AcrRepositoriesListStep";
import { AcrTagListStep } from "./acr/AcrTagListStep";
import { DockerHubContainerRepositoryListStep } from "./dockerHub/DockerHubContainerRepositoryListStep";
import { DockerHubContainerTagListStep } from "./dockerHub/DockerHubContainerTagListStep";
import { DockerHubNamespaceInputStep } from "./dockerHub/DockerHubNamespaceInputStep";

export class ContainerRegistryListStep extends AzureWizardPromptStep<IDeployFromRegistryContext> {
    public hideStepCount: boolean = true;

    public async prompt(context: IDeployFromRegistryContext): Promise<void> {
        const placeHolder: string = localize('selectTag', 'Select a container registry');
        const picks: IAzureQuickPickItem<SupportedRegistries | undefined>[] = [
            { label: 'Azure Container Registries', data: acrDomain },
            { label: 'Docker Hub Registry', data: dockerHubDomain },
            { label: localize('otherPublicRegistry', 'Other public registry'), data: undefined }
        ];

        context.registryDomain = (await context.ui.showQuickPick(picks, { placeHolder })).data;
    }

    public shouldPrompt(context: IDeployFromRegistryContext): boolean {
        return !context.tag && !context.image;
    }

    public async getSubWizard(context: IDeployFromRegistryContext): Promise<IWizardOptions<IDeployFromRegistryContext> | undefined> {
        if (context.image) {
            return undefined;
        }

        const promptSteps: AzureWizardPromptStep<IDeployFromRegistryContext>[] = [];
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
