/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, type IAzureQuickPickItem, type IWizardOptions } from "@microsoft/vscode-azext-utils";
import { UIKind, env } from "vscode";
import { acrDomain, dockerHubDomain, type SupportedRegistries } from "../../../../constants";
import { localize } from "../../../../utils/localize";
import { AcrListStep } from "./acr/AcrListStep";
import { AcrRepositoriesListStep } from "./acr/AcrRepositoriesListStep";
import { AcrTagListStep } from "./acr/AcrTagListStep";
import { type ContainerRegistryImageSourceContext } from "./ContainerRegistryImageSourceContext";
import { DockerHubContainerRepositoryListStep } from "./dockerHub/DockerHubContainerRepositoryListStep";
import { DockerHubContainerTagListStep } from "./dockerHub/DockerHubContainerTagListStep";
import { DockerHubNamespaceInputStep } from "./dockerHub/DockerHubNamespaceInputStep";
import { RegistryImageInputStep } from "./RegistryImageInputStep";

export class ContainerRegistryListStep extends AzureWizardPromptStep<ContainerRegistryImageSourceContext> {
    public hideStepCount: boolean = true;

    public async prompt(context: ContainerRegistryImageSourceContext): Promise<void> {
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

    public shouldPrompt(context: ContainerRegistryImageSourceContext): boolean {
        return !context.image && !context.registryDomain;
    }

    public async getSubWizard(context: ContainerRegistryImageSourceContext): Promise<IWizardOptions<ContainerRegistryImageSourceContext> | undefined> {
        if (context.image) {
            return undefined;
        }

        const promptSteps: AzureWizardPromptStep<ContainerRegistryImageSourceContext>[] = [];
        switch (context.registryDomain) {
            case acrDomain:
                promptSteps.push(new AcrListStep({ suppressCreate: true }), new AcrRepositoriesListStep(), new AcrTagListStep());
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
