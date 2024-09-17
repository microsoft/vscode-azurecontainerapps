/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, nonNullProp, type AzureWizardExecuteStep, type IAzureQuickPickItem, type IWizardOptions } from "@microsoft/vscode-azext-utils";
import { acrDomain, type SupportedRegistries } from "../../constants";
import { detectRegistryDomain } from "../../utils/imageNameUtils";
import { localize } from "../../utils/localize";
import { AcrEnableAdminUserConfirmStep } from "./dockerLogin/AcrEnableAdminUserConfirmStep";
import { AcrEnableAdminUserStep } from "./dockerLogin/AcrEnableAdminUserStep";
import { DockerLoginRegistryCredentialsAddConfigurationStep } from "./dockerLogin/DockerLoginRegistryCredentialsAddConfigurationStep";
import { AcrPullEnableStep } from "./identity/AcrPullEnableStep";
import { ManagedEnvironmentIdentityEnableStep } from "./identity/ManagedEnvironmentIdentityEnableStep";
import { ManagedIdentityRegistryCredentialAddConfigurationStep } from "./identity/ManagedIdentityRegistryCredentialAddConfigurationStep";
import { RegistryCredentialsAndSecretsConfigurationStep } from "./RegistryCredentialsAndSecretsConfigurationStep";
import { type RegistryCredentialsContext } from "./RegistryCredentialsContext";

export enum RegistryCredentialType {
    SystemAssigned,
    DockerLogin,
}

export class RegistryCredentialsAddConfigurationListStep extends AzureWizardPromptStep<RegistryCredentialsContext> {
    private hasExistingRegistry?: boolean;

    public async configureBeforePrompt(context: RegistryCredentialsContext): Promise<void> {
        this.hasExistingRegistry = !!context.containerApp?.configuration?.registries?.some(r => {
            if (!r.server) {
                return false;
            }

            const registryDomain: SupportedRegistries | undefined = this.getRegistryDomain(context);
            if (registryDomain === acrDomain) {
                return r.server === context.registry?.loginServer;
            } else {
                return r.server === DockerLoginRegistryCredentialsAddConfigurationStep.getThirdPartyLoginServer(
                    registryDomain,
                    nonNullProp(context, 'registryName'),
                );
            }
        })
    }

    public async prompt(context: RegistryCredentialsContext): Promise<void> {
        context.newRegistryCredentialType = (await context.ui.showQuickPick(this.getPicks(context), {
            placeHolder: localize('selectCredentialType', 'Select a registry connection method'),
            suppressPersistence: true,
        })).data;
    }

    public shouldPrompt(context: RegistryCredentialsContext): boolean {
        return !this.hasExistingRegistry && !context.newRegistryCredentialType;
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

    private getRegistryDomain(context: RegistryCredentialsContext): SupportedRegistries | undefined {
        if (context.registry?.loginServer || context.registryName) {
            return detectRegistryDomain(context.registry?.loginServer || nonNullProp(context, 'registryName'));
        } else {
            // If no registries exist, we can assume we're creating a new ACR
            return acrDomain;
        }
    }

    public async getPicks(context: RegistryCredentialsContext): Promise<IAzureQuickPickItem<RegistryCredentialType>[]> {
        const picks: IAzureQuickPickItem<RegistryCredentialType>[] = [];
        const registryDomain = this.getRegistryDomain(context);

        if (registryDomain === acrDomain) {
            picks.push({
                label: 'Managed Identity',
                description: '(recommended)',
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
