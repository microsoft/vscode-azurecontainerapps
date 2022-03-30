/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerRegistryManagementClient, ContainerRegistryManagementModels } from "@azure/arm-containerregistry";
import { AzureWizardPromptStep, IAzureQuickPickItem, IWizardOptions } from "@microsoft/vscode-azext-utils";
import { createContainerRegistryManagementClient } from "../../../utils/azureClients";
import { localize } from "../../../utils/localize";
import { nonNullProp } from "../../../utils/nonNull";
import { IDeployImageContext } from "../IDeployImageContext";
import { RegistryEnableAdminUserStep } from "./RegistryEnableAdminUserStep";

export class AcrListStep extends AzureWizardPromptStep<IDeployImageContext> {
    public async prompt(context: IDeployImageContext): Promise<void> {
        const placeHolder: string = localize('selectRegistry', 'Select an Azure Container Registry');
        context.registry = (await context.ui.showQuickPick(this.getPicks(context), { placeHolder })).data;
    }

    public shouldPrompt(context: IDeployImageContext): boolean {
        return !context.registry;
    }

    public async getSubWizard(context: IDeployImageContext): Promise<IWizardOptions<IDeployImageContext> | undefined> {
        if (!context.registry?.adminUserEnabled) {
            return { promptSteps: [new RegistryEnableAdminUserStep()] }
        }

        return undefined;
    }

    public async getPicks(context: IDeployImageContext): Promise<IAzureQuickPickItem<ContainerRegistryManagementModels.Registry>[]> {
        const client: ContainerRegistryManagementClient = await createContainerRegistryManagementClient(context);
        const registries = await client.registries.list();
        return registries.map((r) => { return { label: nonNullProp(r, 'name'), data: r, description: r.loginServer } });
    }
}

