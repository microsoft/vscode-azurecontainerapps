/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { ContainerRegistryManagementClient, Registry } from "@azure/arm-containerregistry";
import { uiUtils } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardPromptStep, IAzureQuickPickItem, IWizardOptions } from "@microsoft/vscode-azext-utils";
import { acrDomain, currentlyDeployed, quickStartImageName } from "../../../../constants";
import { createContainerRegistryManagementClient } from "../../../../utils/azureClients";
import { parseImageName } from "../../../../utils/imageNameUtils";
import { localize } from "../../../../utils/localize";
import { nonNullProp } from "../../../../utils/nonNull";
import { IContainerRegistryImageContext } from "../IContainerRegistryImageContext";
import { getLatestContainerAppImage } from "../getLatestContainerImage";
import { RegistryEnableAdminUserStep } from "./RegistryEnableAdminUserStep";

export class AcrListStep extends AzureWizardPromptStep<IContainerRegistryImageContext> {
    public async prompt(context: IContainerRegistryImageContext): Promise<void> {
        const placeHolder: string = localize('selectRegistry', 'Select an Azure Container Registry');
        context.registry = (await context.ui.showQuickPick(this.getPicks(context), { placeHolder })).data;
    }

    public shouldPrompt(context: IContainerRegistryImageContext): boolean {
        return !context.registry;
    }

    public async getSubWizard(context: IContainerRegistryImageContext): Promise<IWizardOptions<IContainerRegistryImageContext> | undefined> {
        if (!context.registry?.adminUserEnabled) {
            return { promptSteps: [new RegistryEnableAdminUserStep()] }
        }

        return undefined;
    }

    public async getPicks(context: IContainerRegistryImageContext): Promise<IAzureQuickPickItem<Registry>[]> {
        const client: ContainerRegistryManagementClient = await createContainerRegistryManagementClient(context);
        const registries: Registry[] = await uiUtils.listAllIterator(client.registries.list());

        // Try to suggest a registry only when the user is deploying to a Container App
        let suggestedRegistry: string | undefined;
        let srExists: boolean = false;
        if (context.containerApp) {
            const { registryDomain, registryName, imageNameReference } = parseImageName(getLatestContainerAppImage(context.containerApp));

            // If the image is not the default quickstart image, then we can try to suggest a registry based on the latest Container App image
            if (registryDomain === acrDomain && imageNameReference !== quickStartImageName) {
                suggestedRegistry = registryName;
            }

            // Does the suggested registry exist in the list of pulled registries?  If so, move it to the front of the list
            const srIndex: number = registries.findIndex((r) => !!suggestedRegistry && r.loginServer === suggestedRegistry);
            srExists = srIndex !== -1;
            if (srExists) {
                const sr: Registry = registries.splice(srIndex, 1)[0];
                registries.unshift(sr);
            }
        }

        // Preferring 'suppressPersistence: true' over 'priority: highest' to avoid the possibility of a double parenthesis appearing in the description
        return registries.map((r) => {
            return !!suggestedRegistry && r.loginServer === suggestedRegistry ?
                { label: nonNullProp(r, 'name'), data: r, description: `${r.loginServer} ${currentlyDeployed}`, suppressPersistence: true } :
                { label: nonNullProp(r, 'name'), data: r, description: r.loginServer, suppressPersistence: srExists };
        });
    }
}

