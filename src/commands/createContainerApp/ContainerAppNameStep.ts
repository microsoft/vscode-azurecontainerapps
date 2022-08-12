/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerAppsAPIClient } from "@azure/arm-appcontainers";
import { getResourceGroupFromId } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardPromptStep } from "@microsoft/vscode-azext-utils";
import { createContainerAppsAPIClient } from '../../utils/azureClients';
import { localize } from "../../utils/localize";
import { IContainerAppContext } from './IContainerAppContext';

export class ContainerAppNameStep extends AzureWizardPromptStep<IContainerAppContext> {
    public hideStepCount: boolean = true;

    public async prompt(context: IContainerAppContext): Promise<void> {
        const prompt: string = localize('containerAppNamePrompt', 'Enter a name for the new container app.');
        context.newContainerAppName = (await context.ui.showInputBox({
            prompt,
            validateInput: async (value: string | undefined): Promise<string | undefined> => await this.validateInput(context, value)
        })).trim();

        context.valuesToMask.push(context.newContainerAppName);
    }

    public shouldPrompt(context: IContainerAppContext): boolean {
        return !context.newContainerAppName;
    }

    private async validateInput(context: IContainerAppContext, name: string | undefined): Promise<string | undefined> {
        name = name ? name.trim() : '';
        // to prevent showing an error when the character types the first letter

        const { minLength, maxLength } = { minLength: 2, maxLength: 20 };
        if (!/^[a-z]([-a-z0-9]*[a-z0-9])?$/.test(name)) {
            return localize('invalidChar', `A name must consist of lower case alphanumeric characters or '-', start with an alphabetic character, and end with an alphanumeric character and cannot have '--'.`);
        } else if ((name.length < minLength) || name.length > maxLength) {
            return localize('invalidLength', 'The name must be between {0} and {1} characters.', minLength, maxLength);
        }

        // do the API call last
        try {
            const client: ContainerAppsAPIClient = await createContainerAppsAPIClient(context);
            const managedEnvironmentRg = getResourceGroupFromId(context.managedEnvironmentId);
            await client.containerApps.get(managedEnvironmentRg, name);
            return localize('containerAppExists', 'The container app "{0}" already exists in resource group "{1}". Please enter a unique name.', name, managedEnvironmentRg);
        } catch (err) {
            // do nothing
        }


        return undefined;
    }
}
