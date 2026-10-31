/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardExecuteStepWithActivityOutput, nonNullProp } from "@microsoft/vscode-azext-utils";
import { acrDomain, type SupportedRegistries } from "../../../constants";
import { localize } from "../../../utils/localize";
import { type ManagedIdentityRegistryCredentialsContext } from "./ManagedIdentityRegistryCredentialsContext";

export class ManagedIdentityRegistryCredentialsAddConfigurationStep<T extends ManagedIdentityRegistryCredentialsContext> extends AzureWizardExecuteStepWithActivityOutput<T> {
    public priority: number = 470;
    public stepName: string = 'managedIdentityRegistryCredentialsAddConfigurationStep';
    protected getOutputLogSuccess = (context: T) => localize('createUserIdentityRegistryCredentialSuccess', 'Successfully added registry credential for "{0}" (user-assigned identity).', context.newRegistryCredential?.server);
    protected getOutputLogFail = () => localize('createUserIdentityRegistryCredentialFail', 'Failed to add registry credential (user-assigned identity).');
    protected getTreeItemLabel = (context: T) => localize('createUserIdentityRegistryCredentialLabel', 'Add registry credential for "{0}" (user-assigned identity)', context.newRegistryCredential?.server);

    constructor(private readonly supportedRegistryDomain: SupportedRegistries | undefined) {
        super();
    }

    public async execute(context: T): Promise<void> {
        if (this.supportedRegistryDomain !== acrDomain) {
            throw new Error(localize('domainNotSupported', 'The provided registry domain does not have managed identity connection support.'));
        }

        const registry = nonNullProp(context, 'registry');
        context.newRegistryCredential = {
            identity: nonNullProp(nonNullProp(context, 'managedIdentity'), 'id'),
            server: registry.loginServer,
            username: '',
            passwordSecretRef: '',
        };
    }

    public shouldExecute(context: T): boolean {
        return !context.newRegistryCredential;
    }
}
