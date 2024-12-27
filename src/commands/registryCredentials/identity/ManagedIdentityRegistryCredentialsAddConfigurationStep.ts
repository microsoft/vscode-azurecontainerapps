/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardExecuteStep, nonNullProp } from "@microsoft/vscode-azext-utils";
import { acrDomain, type SupportedRegistries } from "../../../constants";
import { localize } from "../../../utils/localize";
import { type ManagedIdentityRegistryCredentialsContext } from "./ManagedIdentityRegistryCredentialsContext";

export class ManagedIdentityRegistryCredentialsAddConfigurationStep extends AzureWizardExecuteStep<ManagedIdentityRegistryCredentialsContext> {
    public priority: number = 470;

    constructor(private readonly supportedRegistryDomain: SupportedRegistries | undefined) {
        super();
    }

    public async execute(context: ManagedIdentityRegistryCredentialsContext): Promise<void> {
        if (this.supportedRegistryDomain !== acrDomain) {
            throw new Error(localize('domainNotSupported', 'The provided registry domain does not have managed identity connection support.'));
        }

        const registry = nonNullProp(context, 'registry');
        context.newRegistryCredential = {
            identity: 'system-environment',
            server: registry.loginServer,
            username: '',
            passwordSecretRef: '',
        };
    }

    public shouldExecute(context: ManagedIdentityRegistryCredentialsContext): boolean {
        return !context.newRegistryCredential;
    }

    // Todo: Add output steps
}
