/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, IAzureQuickPickItem, IWizardOptions } from "@microsoft/vscode-azext-utils";
import { UIKind, env } from "vscode";
import { SupportedRegistries, acrDomain, dockerHubDomain } from "../../../../constants";
import { localize } from "../../../../utils/localize";
import { ContainerRegistryImageContext } from "./IContainerRegistryImageContext";
import { RegistryImageInputStep } from "./RegistryImageInputStep";
import { AcrListStep } from "./acr/AcrListStep";
import { AcrRepositoriesListStep } from "./acr/AcrRepositoriesListStep";
import { AcrTagListStep } from "./acr/AcrTagListStep";
import { DockerHubContainerRepositoryListStep } from "./dockerHub/DockerHubContainerRepositoryListStep";
import { DockerHubContainerTagListStep } from "./dockerHub/DockerHubContainerTagListStep";
import { DockerHubNamespaceInputStep } from "./dockerHub/DockerHubNamespaceInputStep";

export class ContainerRegistryListStep extends AzureWizardPromptStep<ContainerRegistryImageContext> {
    public hideStepCount: boolean = true;

    public async prompt(context: ContainerRegistryImageContext): Promise<void> {
        const placeHolder: string = localize('selectTag', 'Select a container registry');
        const picks: IAzureQuickPickItem<SupportedRegistries | undefined>[] = [];

        picks.push({ label: 'Azure Container Registry', data: acrDomain });
        if (env.uiKind === UIKind.Desktop) {
            // this will fails in vscode.dev due to browser CORS access policies
            picks.push({ label: 'Docker Hub Registry', data: dockerHubDomain });
        }
        // there is a chance that this will fail in vscode.dev due to CORS, but we should still allow the user to enter a custom registry
        picks.push({ label: localize('otherPublicRegistry', 'Other public registry'), data: undefined });

        context.registryDomain = (await context.ui.showQuickPick(picks, { placeHolder })).data;
    }

    public shouldPrompt(context: ContainerRegistryImageContext): boolean {
        return !context.image && !context.registryDomain;
    }

    public async getSubWizard(context: ContainerRegistryImageContext): Promise<IWizardOptions<ContainerRegistryImageContext> | undefined> {
        if (context.image) {
            return undefined;
        }

        const promptSteps: AzureWizardPromptStep<ContainerRegistryImageContext>[] = [];
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
