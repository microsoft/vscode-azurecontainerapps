/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createManagedServiceIdentityClient, parseAzureResourceId, uiUtils } from '@microsoft/vscode-azext-azureutils';
import { AzureWizardPromptStep, nonNullProp, type IAzureQuickPickItem, type IWizardOptions } from '@microsoft/vscode-azext-utils';
import { localize } from '../../../utils/localize';
import { updateLoadingViewProgress } from '../../../webviews/SharedViewState';
import { AcrPullEnableStep } from './AcrPullEnableStep';
import { AcrPullManagedIdentityDefaultSortStrategy, acrPullPickDescription } from './AcrPullManagedIdentityDefaultSortStrategy';
import { ManagedIdentityCreateStep } from './ManagedIdentityCreateStep';
import { type ManagedIdentityPick, type ManagedIdentityPickUpdateStrategy, type ManagedIdentitySelection } from './ManagedIdentityPickUpdateStrategy';
import { type ManagedIdentityRegistryCredentialsContext } from './ManagedIdentityRegistryCredentialsContext';

type IdentitySource = ManagedIdentitySelection['source'];

type IdentityPick = IAzureQuickPickItem<ManagedIdentitySelection | undefined>;

export interface AcrPullManagedIdentityListStepOptions {
    pickUpdateStrategy?: ManagedIdentityPickUpdateStrategy;
}

export class AcrPullManagedIdentityListStep<T extends ManagedIdentityRegistryCredentialsContext> extends AzureWizardPromptStep<T> {
    constructor(readonly options: AcrPullManagedIdentityListStepOptions = {}) {
        super();
        this.options.pickUpdateStrategy ??= new AcrPullManagedIdentityDefaultSortStrategy();
    }

    public async prompt(context: T): Promise<void> {
        const picks = await this.getPicks(context);

        let pick: IdentityPick;
        if (picks.length === 1 && picks[0].data === undefined) {
            pick = picks[0];
        } else {
            pick = await context.ui.showQuickPick(picks, {
                placeHolder: localize('selectRegistryIdentity', 'Select a user-assigned identity for registry access'),
                enableGrouping: true,
                suppressPersistence: true,
            });
        }

        context.managedIdentity = pick.data?.identity;
        updateLoadingViewProgress(localize('selectedRegistryIdentity', 'Selected registry identity'));
    }

    public shouldPrompt(context: T): boolean {
        return !context.managedIdentity && !context.newManagedIdentityName;
    }

    public async getSubWizard(context: T): Promise<IWizardOptions<T> | undefined> {
        if (context.managedIdentity) {
            return undefined;
        }

        return { executeSteps: [new ManagedIdentityCreateStep<T>()] };
    }

    public async getPicks(context: T): Promise<IdentityPick[]> {
        // Attachment IDs identify app/environment membership; the subscription list supplies the picker models.
        const attachedIdentitySources = new Map<string, IdentitySource>();
        for (const id of Object.keys(context.containerApp?.identity?.userAssignedIdentities ?? {})) {
            attachedIdentitySources.set(id.toLowerCase(), 'app');
        }

        // Express identities must be attached to the app, not just its environment.
        if (context.managedEnvironment?.environmentMode !== 'Express') {
            for (const id of Object.keys(context.managedEnvironment?.identity?.userAssignedIdentities ?? {})) {
                if (!attachedIdentitySources.has(id.toLowerCase())) {
                    attachedIdentitySources.set(id.toLowerCase(), 'environment');
                }
            }
        }

        // These listings are independent, so load them concurrently and fetch registry roles only once.
        // The subscription LIST determines which identities the picker displays.
        const client = await createManagedServiceIdentityClient(context);
        const [subscriptionIdentities, registryAcrPullPrincipalIds] = await Promise.all([
            uiUtils.listAllIterator(client.userAssignedIdentities.listBySubscription()),
            // This lists registry role assignments, not identity resources.
            attachedIdentitySources.size ? AcrPullEnableStep.getPrincipalIdsWithRole(context, context.registry?.id) : Promise.resolve(new Set<string>()),
        ]);

        // Only complete subscription models can be selected; no individual identity GETs are needed.
        const identityPicks: ManagedIdentityPick[] = subscriptionIdentities.filter(identity => identity.name && identity.principalId).map(identity => {
            const identityId = nonNullProp(identity, 'id');
            const source = attachedIdentitySources.get(identityId.toLowerCase()) ?? 'existing';
            const resourceGroup = parseAzureResourceId(identityId).resourceGroup;
            // Defer role checks for additional identities to execution rather than querying every list entry.
            // Without a registry ID, access remains unknown until execution.
            const hasAcrPull = source !== 'existing' && !!identity.principalId && registryAcrPullPrincipalIds.has(identity.principalId.toLowerCase());
            return {
                id: identityId,
                label: nonNullProp(identity, 'name'),
                description: hasAcrPull ? `${resourceGroup} ${acrPullPickDescription}` : resourceGroup,
                data: { identity, source },
            };
        });
        const updatedPicks = await this.options.pickUpdateStrategy?.updatePicks(context, identityPicks) ?? identityPicks;

        const createPick: IdentityPick = {
            label: localize('createRegistryIdentity', '$(plus) Create new user-assigned identity'),
            data: undefined,
        };
        return [
            createPick,
            ...updatedPicks,
        ];
    }
}
