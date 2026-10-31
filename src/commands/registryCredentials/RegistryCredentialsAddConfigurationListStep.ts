/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ActivityChildItem, ActivityChildType, activityInfoIcon, AzureWizardPromptStep, createContextValue, nonNullProp, prependOrInsertAfterLastInfoChild, type ActivityInfoChild, type AzureWizardExecuteStep, type ConfirmationViewProperty, type IAzureQuickPickItem, type IWizardOptions } from "@microsoft/vscode-azext-utils";
import { acrDomain, activityInfoContext, type SupportedRegistries } from "../../constants";
import { ext } from "../../extensionVariables";
import { getRegistryDomainFromContext } from "../../utils/imageNameUtils";
import { localize } from "../../utils/localize";
import { updateLoadingViewProgress } from "../../webviews/SharedViewState";
import { AcrEnableAdminUserConfirmStep } from "./dockerLogin/AcrEnableAdminUserConfirmStep";
import { AcrEnableAdminUserStep } from "./dockerLogin/AcrEnableAdminUserStep";
import { DockerLoginRegistryCredentialsAddConfigurationStep } from "./dockerLogin/DockerLoginRegistryCredentialsAddConfigurationStep";
import { AcrPullEnableStep } from "./identity/AcrPullEnableStep";
import { AcrPullManagedIdentityDefaultSortStrategy } from './identity/AcrPullManagedIdentityDefaultSortStrategy';
import { AcrPullManagedIdentityListStep } from './identity/AcrPullManagedIdentityListStep';
import { assessRegistryPullAccess, type RegistryPullAccess } from "./identity/assessRegistryPullAccess";
import { ManagedIdentityRegistryCredentialsAddConfigurationStep } from "./identity/ManagedIdentityRegistryCredentialsAddConfigurationStep";
import { RegistryCredentialsAndSecretsConfigurationStep } from "./RegistryCredentialsAndSecretsConfigurationStep";
import { type RegistryCredentialsContext } from "./RegistryCredentialsContext";

export enum RegistryCredentialType {
    UserAssigned = 'user-assigned',
    DockerLogin = 'docker-login',
}

export class RegistryCredentialsAddConfigurationListStep extends AzureWizardPromptStep<RegistryCredentialsContext> {
    private requiresRegistryConfiguration: boolean;
    private registryPullAccess: RegistryPullAccess | undefined;
    public pickLabel: string | undefined;

    public async configureBeforePrompt(context: RegistryCredentialsContext): Promise<void> {
        this.registryPullAccess = undefined;
        const registryDomain: SupportedRegistries | undefined = getRegistryDomainFromContext(context);

        // 1. See if we have any saved credentials for the target registry; an identity reference still needs its AcrPull access verified.
        const existingRegistryCredential = context.containerApp?.configuration?.registries?.find(r => {
            if (!r.server) {
                return false;
            }

            if (registryDomain === acrDomain) {
                return r.server.toLowerCase() === context.registry?.loginServer?.toLowerCase();
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

        // 2. If it's a public third-party image, do not require registry credentials, else do.
        if (registryDomain !== acrDomain) {
            this.requiresRegistryConfiguration = !!context.registryName
                && !!context.username
                && !!context.secret
                && !existingRegistryCredential;
            return;
        }

        // 3. Reuse any existing ACR password-based credentials.
        if (existingRegistryCredential && !existingRegistryCredential.identity) {
            this.requiresRegistryConfiguration = false;
            return;
        }

        // 4. The matching registry credential either references an identity or is undefined.
        // Even without a saved credential, an eligible attached identity may already have AcrPull on this registry.
        // Check for existing access before falling back to the preset method; reuse may only need a registry reference.
        this.registryPullAccess = await assessRegistryPullAccess(context, existingRegistryCredential);
        this.requiresRegistryConfiguration = this.registryPullAccess.status === 'none';
    }

    public async prompt(context: RegistryCredentialsContext): Promise<void> {
        let placeHolder: string;
        switch (true) {
            case !!context.registry:
                placeHolder = localize('selectCredentialTypeExistingRegistry', 'Select a connection method for registry "{0}"', context.registry?.name);
                break;
            case !!context.newRegistryName:
                placeHolder = localize('selectCredentialTypeNewRegistry', 'Select a connection method for new registry "{0}"', context.newRegistryName);
                break;
            default:
                placeHolder = localize('selectCredentialTypeGeneric', 'Select a registry connection method');
        }

        const pick = (await context.ui.showQuickPick(this.getPicks(context), {
            placeHolder,
            suppressPersistence: true,
        }));

        this.pickLabel = pick.label;
        context.newRegistryCredentialType = pick.data;
        updateLoadingViewProgress(localize('selectedConnectionMethod', 'Selected connection method'));
    }

    public shouldPrompt(context: RegistryCredentialsContext): boolean {
        return this.requiresRegistryConfiguration && !context.newRegistryCredentialType;
    }

    public confirmationViewProperty(_context: RegistryCredentialsContext): ConfirmationViewProperty {
        return {
            name: localize('connectionMethod', 'Connection method'),
            value: this.pickLabel ?? '',
            contextPropertyName: 'newRegistryCredentialType',
        };
    }

    public async getSubWizard(context: RegistryCredentialsContext): Promise<IWizardOptions<RegistryCredentialsContext> | undefined> {
        if (!this.requiresRegistryConfiguration) {
            if (this.registryPullAccess?.status === 'available') {
                context.newRegistryCredential = {
                    server: nonNullProp(nonNullProp(context, 'registry'), 'loginServer'),
                    identity: this.registryPullAccess.identity,
                    username: '',
                    passwordSecretRef: '',
                };
            }

            context.telemetry.properties.newRegistryCredentialType = 'useExisting';
            prependOrInsertAfterLastInfoChild(context,
                new ActivityChildItem({
                    label: localize('useExistingRegistryCredentials', 'Use existing registry credentials'),
                    contextValue: createContextValue(['registryCredentialsAddConfigurationListStepItem', activityInfoContext]),
                    activityType: ActivityChildType.Info,
                    iconPath: activityInfoIcon,
                    stepId: this.id,
                }) as ActivityInfoChild,
            );
            const message = this.registryPullAccess
                ? localize('verifiedRegistryIdentity', 'Verified existing managed identity registry access.')
                : localize('usingRegistryCredentials', 'Using existing registry credentials.');
            ext.outputChannel.appendLog(message);
            return { executeSteps: [new RegistryCredentialsAndSecretsConfigurationStep()] };
        }

        const promptSteps: AzureWizardPromptStep<RegistryCredentialsContext>[] = [];
        const executeSteps: AzureWizardExecuteStep<RegistryCredentialsContext>[] = [];

        const registryDomain: SupportedRegistries | undefined = getRegistryDomainFromContext(context);
        switch (context.newRegistryCredentialType) {
            case RegistryCredentialType.UserAssigned:
                context.telemetry.properties.newRegistryCredentialType = RegistryCredentialType.UserAssigned;
                promptSteps.push(new AcrPullManagedIdentityListStep({ pickUpdateStrategy: new AcrPullManagedIdentityDefaultSortStrategy() }));
                executeSteps.push(
                    new AcrPullEnableStep(),
                    new ManagedIdentityRegistryCredentialsAddConfigurationStep(registryDomain),
                );
                break;
            case RegistryCredentialType.DockerLogin:
                context.telemetry.properties.newRegistryCredentialType = RegistryCredentialType.DockerLogin;
                promptSteps.push(new AcrEnableAdminUserConfirmStep());
                executeSteps.push(
                    new AcrEnableAdminUserStep(),
                    new DockerLoginRegistryCredentialsAddConfigurationStep(registryDomain),
                );
                break;
        }

        executeSteps.push(new RegistryCredentialsAndSecretsConfigurationStep());

        return {
            promptSteps,
            executeSteps,
        };
    }

    public async getPicks(context: RegistryCredentialsContext): Promise<IAzureQuickPickItem<RegistryCredentialType>[]> {
        const picks: IAzureQuickPickItem<RegistryCredentialType>[] = [];
        const registryDomain = getRegistryDomainFromContext(context);

        if (registryDomain === acrDomain) {
            picks.push({
                label: localize('userAssignedIdentity', 'User-assigned Managed Identity'),
                description: localize('recommended', '(recommended)'),
                detail: localize('selectUserIdentityDetails', 'Use an existing user-assigned identity or create one with "{0}" access to the registry', 'AcrPull'),
                data: RegistryCredentialType.UserAssigned,
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
