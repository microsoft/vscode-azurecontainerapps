/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { ContainerRegistryManagementClient, Registry } from "@azure/arm-containerregistry";
import { uiUtils } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardPromptStep, IAzureQuickPickItem, IWizardOptions } from "@microsoft/vscode-azext-utils";
import { acrDomain, latestImage, quickStartImageName } from "../../../../constants";
import type { ContainerAppModel } from "../../../../tree/ContainerAppItem";
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

        const containerApp: ContainerAppModel = nonNullProp(context, 'targetContainer');
        const { registryDomain, registryName, referenceImageName } = parseImageName(getLatestContainerAppImage(containerApp));

        // If the image is not the default quickstart image, then we can try to suggest a registry based on the latest Container App image
        let predictedRegistry: string | undefined;
        if (registryDomain === acrDomain && referenceImageName !== quickStartImageName) {
            predictedRegistry = registryName;
        }

        // Does the predicted registry exist in the list of pulled registries?  If so, move it to the front of the list
        const prIndex: number = registries.findIndex((r) => !!predictedRegistry && r.loginServer === predictedRegistry);
        const prExists: boolean = prIndex !== -1;

        if (prExists) {
            const pr: Registry = registries.splice(prIndex, 1)[0];
            registries.unshift(pr);
        }

        // Preferring 'suppressPersistence: true' over 'priority: highest' to avoid the possibility of a double parenthesis appearing in the description
        return registries.map((r) => {
            return !!predictedRegistry && r.loginServer === predictedRegistry ?
                { label: nonNullProp(r, 'name'), data: r, description: `${r.loginServer} ${latestImage}`, suppressPersistence: true } :
                { label: nonNullProp(r, 'name'), data: r, description: r.loginServer, suppressPersistence: prExists };
        });
    }
}

