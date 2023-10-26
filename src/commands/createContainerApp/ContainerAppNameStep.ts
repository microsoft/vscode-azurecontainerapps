/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerAppsAPIClient } from "@azure/arm-appcontainers";
import { getResourceGroupFromId } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardPromptStep, ISubscriptionActionContext, nonNullProp } from "@microsoft/vscode-azext-utils";
import { createContainerAppsAPIClient } from '../../utils/azureClients';
import { localize } from "../../utils/localize";
import { CreateContainerAppContext } from './CreateContainerAppContext';

export class ContainerAppNameStep extends AzureWizardPromptStep<CreateContainerAppContext> {
    public hideStepCount: boolean = true;

    public async prompt(context: CreateContainerAppContext): Promise<void> {
        const prompt: string = localize('containerAppNamePrompt', 'Enter a container app name.');
        context.newContainerAppName = (await context.ui.showInputBox({
            prompt,
            validateInput: this.validateInput,
            asyncValidationTask: (name: string) => this.validateNameAvailable(context, name)
        })).trim();

        context.valuesToMask.push(context.newContainerAppName);
    }

    public shouldPrompt(context: CreateContainerAppContext): boolean {
        return !context.containerApp && !context.newContainerAppName;
    }

    private validateInput(name: string | undefined): string | undefined {
        name = name ? name.trim() : '';

        const { minLength, maxLength } = { minLength: 1, maxLength: 32 };
        if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(name)) {
            return localize('invalidChar', `A name must consist of lower case alphanumeric characters or '-', start with an alphabetic character, and end with an alphanumeric character and cannot have '--'.`);
        } else if ((name.length < minLength) || name.length > maxLength) {
            return localize('invalidLength', 'The name must be between {0} and {1} characters.', minLength, maxLength);
        }

        return undefined;
    }

    private async validateNameAvailable(context: CreateContainerAppContext, name: string): Promise<string | undefined> {
        const resourceGroupName: string = getResourceGroupFromId(nonNullProp(context, 'managedEnvironmentId'));
        if (!await ContainerAppNameStep.isNameAvailable(context, resourceGroupName, name)) {
            return localize('containerAppExists', 'The container app "{0}" already exists in resource group "{1}".', name, resourceGroupName);
        }
        return undefined;
    }

    public static async isNameAvailable(context: ISubscriptionActionContext, resourceGroupName: string, containerAppName: string): Promise<boolean> {
        const client: ContainerAppsAPIClient = await createContainerAppsAPIClient(context);
        try {
            await client.containerApps.get(resourceGroupName, containerAppName);
            return false;
        } catch (_e) {
            return true;
        }
    }
}
