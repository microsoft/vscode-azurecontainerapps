/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerRegistryManagementClient, ContainerRegistryManagementModels } from "@azure/arm-containerregistry";
import { AzureWizardPromptStep, IAzureQuickPickItem } from "vscode-azureextensionui";
import { createContainerRegistryManagementClient } from "../../utils/azureClients";
import { localize } from "../../utils/localize";
import { nonNullProp } from "../../utils/nonNull";
import { IContainerAppContext } from "../createContainerApp/IContainerAppContext";

export class ContainerRegistryListStep extends AzureWizardPromptStep<IContainerAppContext> {
    public async prompt(context: IContainerAppContext): Promise<void> {
        const client: ContainerRegistryManagementClient = await createContainerRegistryManagementClient(context);
        const registries = await client.registries.list();
        const picks: IAzureQuickPickItem<ContainerRegistryManagementModels.Registry>[] = registries.map((r) => { return { label: nonNullProp(r, 'name'), data: r, description: r.loginServer } });

        const placeHolder: string = localize('selectACR', 'Select a Azure Container Registry to pull a container from');
        context.registry = (await context.ui.showQuickPick(picks, { placeHolder })).data;
    }

    public shouldPrompt(context: IContainerAppContext): boolean {
        return !context.registry;
    }
}
