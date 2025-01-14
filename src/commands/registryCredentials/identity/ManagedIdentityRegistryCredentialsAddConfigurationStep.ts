/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { nonNullProp } from "@microsoft/vscode-azext-utils";
import { acrDomain, type SupportedRegistries } from "../../../constants";
import { localize } from "../../../utils/localize";
import { AzureWizardActivityOutputExecuteStep } from "../../AzureWizardActivityOutputExecuteStep";
import { type ManagedIdentityRegistryCredentialsContext } from "./ManagedIdentityRegistryCredentialsContext";

export class ManagedIdentityRegistryCredentialsAddConfigurationStep<T extends ManagedIdentityRegistryCredentialsContext> extends AzureWizardActivityOutputExecuteStep<T> {
    public priority: number = 470;
    public stepName: string = 'managedIdentityRegistryCredentialsAddConfigurationStep';
    protected getSuccessString = (context: T) => localize('createRegistryCredentialSuccess', 'Successfully added registry credential for "{0}" (system-assigned identity).', context.newRegistryCredential?.server);
    protected getFailString = () => localize('createRegistryCredentialFail', 'Failed to add registry credential (system-assigned identity).');
    protected getTreeItemLabel = (context: T) => localize('createRegistryCredentialLabel', 'Add registry credential for "{0}" (system-assigned identity)', context.newRegistryCredential?.server);

    constructor(private readonly supportedRegistryDomain: SupportedRegistries | undefined) {
        super();
    }

    public async execute(context: T): Promise<void> {
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

    public shouldExecute(context: T): boolean {
        return !context.newRegistryCredential;
    }
}
