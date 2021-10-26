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

let checkNameLength: boolean = false;
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
        name = name ? name.trim() : '';
        // to prevent showing an error when the character types the first letter
        checkNameLength = checkNameLength || name.length > 1;

        const { minLength, maxLength } = { minLength: 2, maxLength: 20 };
        if (!/^[a-z]([-a-z0-9]*[a-z0-9])?$/.test(name)) {
            return localize('invalidChar', `A name must consist of lower case alphanumeric characters or '-', start with an alphabetic character, and end with an alphanumeric character and cannot have '--'.`);
        } else if ((checkNameLength && name.length < minLength) || name.length > maxLength) {
            return localize('invalidLength', 'The name must be between {0} and {1} characters.', minLength, maxLength);
        }

        // do the API call last
        const client: WebSiteManagementClient = await createWebSiteClient(context);
        const availability = await client.checkNameAvailability(name, containerAppProvider);
        if (!availability.nameAvailable) {
            return availability.reason;
        }


        return undefined;
    }
}
