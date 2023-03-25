/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { ContainerRegistryManagementClient, Registry } from "@azure/arm-containerregistry";
import { uiUtils } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardPromptStep, IAzureQuickPickItem, IWizardOptions } from "@microsoft/vscode-azext-utils";
import { acrDomain, quickStartImageName } from "../../../../constants";
import { createContainerRegistryManagementClient } from "../../../../utils/azureClients";
import { parseImageName } from "../../../../utils/imageNameUtils";
import { localize } from "../../../../utils/localize";
import { nonNullProp } from "../../../../utils/nonNull";
import { IContainerRegistryImageContext } from "../IContainerRegistryImageContext";
import { RegistryEnableAdminUserStep } from "./RegistryEnableAdminUserStep";

export class AcrListStep extends AzureWizardPromptStep<IContainerRegistryImageContext> {
    public async prompt(context: IContainerRegistryImageContext): Promise<void> {
        const { registryDomain, registryName, referenceImageName } = parseImageName(context.targetContainer?.template?.containers?.[0]?.image);

        let predictedRegistry: string | undefined;
        if (registryDomain === acrDomain && referenceImageName !== quickStartImageName) {
            predictedRegistry = registryName;
        }

        const placeHolder: string = localize('selectRegistry', 'Select an Azure Container Registry');
        context.registry = (await context.ui.showQuickPick(this.getPicks(context, predictedRegistry), { placeHolder })).data;
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

    public async getPicks(context: IContainerRegistryImageContext, predictedRegistry?: string): Promise<IAzureQuickPickItem<Registry>[]> {
        const client: ContainerRegistryManagementClient = await createContainerRegistryManagementClient(context);
        const registries = await uiUtils.listAllIterator(client.registries.list());
        const registryPicks = registries.map((r) => { return { label: nonNullProp(r, 'name'), data: r, description: r.loginServer, suppressPersistence: !!predictedRegistry } });

        // We should swap and do the registryPicks after this logic in case we can't find the predictedRegistry, that way suppressPersistence will be true when it needs to be....
        if (predictedRegistry) {
            const prIndex: number = registryPicks.findIndex((r) => r.data.loginServer === predictedRegistry);

            if (prIndex !== -1) {
                const predictedPick = registryPicks.splice(prIndex, 1)[0];
                predictedPick.description += ' (previously used)';
                registryPicks.unshift(predictedPick);
            }
        }

        return registryPicks;
    }
}

