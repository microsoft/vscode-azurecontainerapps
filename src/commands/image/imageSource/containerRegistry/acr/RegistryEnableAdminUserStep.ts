

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ContainerRegistryManagementClient } from "@azure/arm-containerregistry";
import { getResourceGroupFromId } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardPromptStep, nonNullProp, nonNullValue } from "@microsoft/vscode-azext-utils";
import { createContainerRegistryManagementClient } from "../../../../../utils/azureClients";
import { localize } from "../../../../../utils/localize";
import { type ContainerRegistryImageSourceContext } from "../ContainerRegistryImageSourceContext";

export class RegistryEnableAdminUserStep extends AzureWizardPromptStep<ContainerRegistryImageSourceContext> {
    public async prompt(context: ContainerRegistryImageSourceContext): Promise<void> {
        const message = localize('enableAdminUser', 'An admin user is required to continue. If enabled, you can use the registry name as username and admin user access key as password to docker login to your container registry.');
        await context.ui.showWarningMessage(message, { modal: true }, { title: localize('enable', 'Enable') });

        const registry = nonNullValue(context.registry);
        registry.adminUserEnabled = true;

        const client: ContainerRegistryManagementClient = await createContainerRegistryManagementClient(context);
        const updatedRegistry = await client.registries.beginUpdateAndWait(getResourceGroupFromId(nonNullProp(registry, 'id')), nonNullProp(registry, 'name'), registry);

        if (!updatedRegistry.adminUserEnabled) {
            throw new Error(localize('failedToUpdate', 'Failed to enable admin user for registry "{0}". Go to the portal to manually update.', registry.name));
        }
    }

    public shouldPrompt(context: ContainerRegistryImageSourceContext): boolean {
        return !!context.registry && !context.registry.adminUserEnabled;
    }
}
