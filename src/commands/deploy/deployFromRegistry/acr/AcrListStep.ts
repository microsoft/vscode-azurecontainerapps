/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { ContainerRegistryManagementClient, Registry } from "@azure/arm-containerregistry";
import { uiUtils } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardPromptStep, IAzureQuickPickItem, IWizardOptions } from "@microsoft/vscode-azext-utils";
import { createContainerRegistryManagementClient } from "../../../../utils/azureClients";
import { localize } from "../../../../utils/localize";
import { nonNullProp } from "../../../../utils/nonNull";
import { IDeployFromRegistryContext } from "../IDeployFromRegistryContext";
import { RegistryEnableAdminUserStep } from "./RegistryEnableAdminUserStep";

export class AcrListStep extends AzureWizardPromptStep<IDeployFromRegistryContext> {
    public async prompt(context: IDeployFromRegistryContext): Promise<void> {
        const placeHolder: string = localize('selectRegistry', 'Select an Azure Container Registry');
        context.registry = (await context.ui.showQuickPick(this.getPicks(context), { placeHolder })).data;
    }

    public shouldPrompt(context: IDeployFromRegistryContext): boolean {
        return !context.registry;
    }

    public async getSubWizard(context: IDeployFromRegistryContext): Promise<IWizardOptions<IDeployFromRegistryContext> | undefined> {
        if (!context.registry?.adminUserEnabled) {
            return { promptSteps: [new RegistryEnableAdminUserStep()] }
        }

        return undefined;
    }

    public async getPicks(context: IDeployFromRegistryContext): Promise<IAzureQuickPickItem<Registry>[]> {
        const client: ContainerRegistryManagementClient = await createContainerRegistryManagementClient(context);
        const registries = await uiUtils.listAllIterator(client.registries.list());
        return registries.map((r) => { return { label: nonNullProp(r, 'name'), data: r, description: r.loginServer } });
    }
}

