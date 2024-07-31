/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, nonNullProp, type AzureWizardExecuteStep, type IAzureQuickPickItem, type IWizardOptions } from "@microsoft/vscode-azext-utils";
import { acrDomain, type SupportedRegistries } from "../../constants";
import { detectRegistryDomain } from "../../utils/imageNameUtils";
import { localize } from "../../utils/localize";
import { AcrEnableAdminUserStep } from "./adminUser/AcrEnableAdminUserStep";
import { AdminUserRegistryCredentialAddConfigurationStep } from "./adminUser/AdminUserRegistryCredentialAddConfigurationStep";
import { AcrPullEnableStep } from "./identity/AcrPullEnableStep";
import { ManagedEnvironmentIdentityEnableStep } from "./identity/ManagedEnvironmentIdentityEnableStep";
import { ManagedIdentityRegistryCredentialAddConfigurationStep } from "./identity/ManagedIdentityRegistryCredentialAddConfigurationStep";
import { RegistryCredentialsAndSecretsConfigurationStep } from "./RegistryCredentialsAndSecretsConfigurationStep";
import { type RegistryCredentialsContext } from "./RegistryCredentialsContext";

export enum RegistryCredentialType {
    SystemAssigned,
    AdminUser,
}

export class RegistryCredentialAddConfigurationListStep extends AzureWizardPromptStep<RegistryCredentialsContext> {
    public async prompt(context: RegistryCredentialsContext): Promise<void> {
        context.newRegistryCredentialType = (await context.ui.showQuickPick(this.getPicks(context), {
            placeHolder: localize('selectCredentialType', 'Select a registry credential connection type'),
        })).data;
    }

    public shouldPrompt(context: RegistryCredentialsContext): boolean {
        const hasExistingRegistry: boolean = !!context.containerApp?.configuration?.registries?.some(r => r.server && r.server === context.registry?.loginServer);
        return !context.newRegistryCredentialType || hasExistingRegistry;
    }

    public async getSubWizard(context: RegistryCredentialsContext): Promise<IWizardOptions<RegistryCredentialsContext> | undefined> {
        const promptSteps: AzureWizardPromptStep<RegistryCredentialsContext>[] = [];
        const executeSteps: AzureWizardExecuteStep<RegistryCredentialsContext>[] = [];

        const registryDomain: SupportedRegistries | undefined = this.getRegistryDomain(context);
        switch (context.newRegistryCredentialType) {
            case RegistryCredentialType.SystemAssigned:
                executeSteps.push(
                    new ManagedEnvironmentIdentityEnableStep(),
                    new AcrPullEnableStep(),
                    new ManagedIdentityRegistryCredentialAddConfigurationStep(registryDomain),
                );
                break;
            case RegistryCredentialType.AdminUser:
                promptSteps.push(new AcrEnableAdminUserStep());
                executeSteps.push(new AdminUserRegistryCredentialAddConfigurationStep(registryDomain));
                break;
        }

        // Todo: Add log outputs to tell the user when we skip adding a new credential because one already exists

        executeSteps.push(new RegistryCredentialsAndSecretsConfigurationStep());

        return {
            promptSteps,
            executeSteps,
        };
    }

    private getRegistryDomain(context: RegistryCredentialsContext): SupportedRegistries | undefined {
        if (context.registry || context.registryName) {
            return detectRegistryDomain(context.registry?.loginServer || nonNullProp(context, 'registryName'));
        } else {
            // If no registries exist, we must be creating a new one and it must be an ACR
            return acrDomain;
        }
    }

    public async getPicks(context: RegistryCredentialsContext): Promise<IAzureQuickPickItem<RegistryCredentialType>[]> {
        const picks: IAzureQuickPickItem<RegistryCredentialType>[] = [];
        const registryDomain = this.getRegistryDomain(context);

        if (registryDomain === acrDomain && this.userCanSetRBACRoles()) {
            picks.push({
                label: 'Managed Identity',
                description: '(recommended)',
                detail: localize('systemIdentityDetails', 'Enable a system-assigned identity on the container apps environment and provide that identity "{0}" RBAC approval access to the container registry.', 'acrPull'),
                data: RegistryCredentialType.SystemAssigned,
            });
        }

        // Todo: Investigate... if you do not have RBAC role assignment access, can you still enable admin user?
        picks.push({
            label: 'Admin Credentials',
            detail: localize('adminUserDetails', 'Enable admin user access on the container registry. Configure the container app to connect directly the admin username and password.'),
            data: RegistryCredentialType.AdminUser,
        });

        // Todo: Should we add an info link (aka.ms)??

        return picks;
    }

    private userCanSetRBACRoles(): boolean {
        // Todo: Investigate and add a real implementation for this method
        return true;
    }
}
