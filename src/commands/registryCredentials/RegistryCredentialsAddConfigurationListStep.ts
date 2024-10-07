/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, nonNullProp, type AzureWizardExecuteStep, type IAzureQuickPickItem, type IWizardOptions } from "@microsoft/vscode-azext-utils";
import { acrDomain, type SupportedRegistries } from "../../constants";
import { localize } from "../../utils/localize";
import { AcrEnableAdminUserConfirmStep } from "./dockerLogin/AcrEnableAdminUserConfirmStep";
import { AcrEnableAdminUserStep } from "./dockerLogin/AcrEnableAdminUserStep";
import { DockerLoginRegistryCredentialsAddConfigurationStep } from "./dockerLogin/DockerLoginRegistryCredentialsAddConfigurationStep";
import { getRegistryDomain } from "./getRegistryDomain";
import { AcrPullEnableStep } from "./identity/AcrPullEnableStep";
import { AcrPullVerifyStep } from "./identity/AcrPullVerifyStep";
import { ManagedEnvironmentIdentityEnableStep } from "./identity/ManagedEnvironmentIdentityEnableStep";
import { ManagedIdentityRegistryCredentialsAddConfigurationStep } from "./identity/ManagedIdentityRegistryCredentialsAddConfigurationStep";
import { RegistryCredentialsAndSecretsConfigurationStep } from "./RegistryCredentialsAndSecretsConfigurationStep";
import { type RegistryCredentialsContext } from "./RegistryCredentialsContext";

export enum RegistryCredentialType {
    SystemAssigned,
    DockerLogin,
}

export class RegistryCredentialsAddConfigurationListStep extends AzureWizardPromptStep<RegistryCredentialsContext> {
    private requiresRegistryConfiguration: boolean;

    public async configureBeforePrompt(context: RegistryCredentialsContext): Promise<void> {
        const registryDomain: SupportedRegistries | undefined = getRegistryDomain(context);
        const hasExistingConfiguration: boolean = !!context.containerApp?.configuration?.registries?.some(r => {
            if (!r.server) {
                return false;
            }

            if (registryDomain === acrDomain) {
                return r.server === context.registry?.loginServer;
            } else if (context.registryName) {
                return r.server === DockerLoginRegistryCredentialsAddConfigurationStep.getThirdPartyLoginServer(
                    registryDomain,
                    nonNullProp(context, 'registryName'),
                );
            }

            // At this point, there is the small possibility of an existing configuration existing that we don't have
            // enough information to match.  This edge case usually happens for public repositories that are under the same
            // private account configuration.  The good news is that these public repositories don't actually need a configuration
            // to be registered because they are public, so the 'requiresRegistryConfiguration' check should be sufficient to handle these cases.
            return false;
        });

        // Rule 1: If we're configuring a new ACR and don't have an existing configuration, we need to create one
        // Rule 2: If we're configuring a new third party registry and don't have an existing configuration -- only do so if it's not a public repository.  We can detect this with the registryName, username, and secret
        this.requiresRegistryConfiguration = (registryDomain === acrDomain || (!!context.registryName && !!context.username && !!context.secret)) && !hasExistingConfiguration;
    }

    public async prompt(context: RegistryCredentialsContext): Promise<void> {
        context.newRegistryCredentialType = (await context.ui.showQuickPick(this.getPicks(context), {
            placeHolder: localize('selectCredentialType', 'Select a registry connection method'),
            suppressPersistence: true,
        })).data;
    }

    public shouldPrompt(context: RegistryCredentialsContext): boolean {
        return this.requiresRegistryConfiguration && !context.newRegistryCredentialType;
    }

    public async getSubWizard(context: RegistryCredentialsContext): Promise<IWizardOptions<RegistryCredentialsContext> | undefined> {
        const promptSteps: AzureWizardPromptStep<RegistryCredentialsContext>[] = [];
        const executeSteps: AzureWizardExecuteStep<RegistryCredentialsContext>[] = [];

        const registryDomain: SupportedRegistries | undefined = getRegistryDomain(context);
        switch (context.newRegistryCredentialType) {
            case RegistryCredentialType.SystemAssigned:
                executeSteps.push(
                    new ManagedEnvironmentIdentityEnableStep(),
                    new AcrPullVerifyStep(),
                    new AcrPullEnableStep(),
                    new ManagedIdentityRegistryCredentialsAddConfigurationStep(registryDomain),
                );
                break;
            case RegistryCredentialType.DockerLogin:
                promptSteps.push(new AcrEnableAdminUserConfirmStep());
                executeSteps.push(
                    new AcrEnableAdminUserStep(),
                    new DockerLoginRegistryCredentialsAddConfigurationStep(registryDomain),
                );
                break;
            default:
        }

        executeSteps.push(new RegistryCredentialsAndSecretsConfigurationStep());

        return {
            promptSteps,
            executeSteps,
        };
    }



    public async getPicks(context: RegistryCredentialsContext): Promise<IAzureQuickPickItem<RegistryCredentialType>[]> {
        const picks: IAzureQuickPickItem<RegistryCredentialType>[] = [];
        const registryDomain = getRegistryDomain(context);

        if (registryDomain === acrDomain) {
            picks.push({
                label: 'Managed Identity',
                description: localize('recommended', '(recommended)'),
                detail: localize('systemIdentityDetails', 'Setup "{0}" access for container environment resources via a system-assigned identity', 'acrPull'),
                data: RegistryCredentialType.SystemAssigned,
            });
        }

        picks.push({
            label: 'Docker Login Credentials',
            detail: localize('dockerLoginDetails', 'Setup docker login access to a registry via username and password.'),
            data: RegistryCredentialType.DockerLogin,
        });

        return picks;
    }
}
