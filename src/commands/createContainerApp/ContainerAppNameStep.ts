/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { WebSiteManagementClient } from '@azure/arm-appservice';
import { AzureWizardPromptStep } from "vscode-azureextensionui";
import { containerAppProvider } from '../../constants';
import { createWebSiteClient } from '../../utils/azureClients';
import { localize } from "../../utils/localize";
import { IContainerAppContext } from './IContainerAppContext';

export class ContainerAppNameStep extends AzureWizardPromptStep<IContainerAppContext> {
    public async prompt(context: IContainerAppContext): Promise<void> {
        const prompt: string = localize('staticWebAppNamePrompt', 'Enter a name for the new static web app.');
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
        const client: WebSiteManagementClient = await createWebSiteClient(context);
        name = name ? name.trim() : '';
        const availability = await client.checkNameAvailability(name, containerAppProvider);

        // TODO: Find out the min/max lengths and valid characters
        if (!availability.nameAvailable) {
            return availability.reason;
        }

        return undefined;
    }
}
