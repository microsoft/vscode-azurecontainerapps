/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from "@microsoft/vscode-azext-utils";
import { localize } from "../../../utils/localize";
import { type AdminUserRegistryCredentialsContext } from "./AdminUserRegistryCredentialsContext";

export class AcrEnableAdminUserConfirmStep extends AzureWizardPromptStep<AdminUserRegistryCredentialsContext> {
    public async prompt(context: AdminUserRegistryCredentialsContext): Promise<void> {
        const message = localize('enableAdminUser', 'Admin user login is required to continue. If enabled, it will allow docker logins to your ACR using the registry\'s access username and password.');
        await context.ui.showWarningMessage(message, { modal: true }, { title: localize('enable', 'Enable') });
    }

    public shouldPrompt(context: AdminUserRegistryCredentialsContext): boolean {
        return !!context.registry && !context.registry.adminUserEnabled;
    }
}
