/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from "@microsoft/vscode-azext-utils";
import { acrDomain } from "../../../constants";
import { getRegistryDomainFromContext } from "../../../utils/imageNameUtils";
import { localize } from "../../../utils/localize";
import { type DockerLoginRegistryCredentialsContext } from "./DockerLoginRegistryCredentialsContext";

export class AcrEnableAdminUserConfirmStep extends AzureWizardPromptStep<DockerLoginRegistryCredentialsContext> {
    public async prompt(context: DockerLoginRegistryCredentialsContext): Promise<void> {
        const message = localize('enableAdminUser', 'Admin user login is required to continue. If enabled, it will allow docker login access to your ACR using the registry\'s username and password.');
        await context.ui.showWarningMessage(message, { modal: true }, { title: localize('enable', 'Enable') });
    }

    public shouldPrompt(context: DockerLoginRegistryCredentialsContext): boolean {
        return context.acrEnableAdminUserConfirmed !== undefined && getRegistryDomainFromContext(context) === acrDomain && !context.registry?.adminUserEnabled;
    }
}
