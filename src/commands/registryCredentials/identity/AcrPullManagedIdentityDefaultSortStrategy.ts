/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { parseAzureResourceId } from '@microsoft/vscode-azext-azureutils';
import { nonNullProp } from '@microsoft/vscode-azext-utils';
import { localize } from '../../../utils/localize';
import { hasMatchingPickDescription } from '../../../utils/pickUtils';
import { type ManagedIdentityPick, type ManagedIdentityPickUpdateContext, type ManagedIdentityPickUpdateStrategy } from './ManagedIdentityPickUpdateStrategy';

export const acrPullPickDescription: string = localize('acrPullPickDescription', '(AcrPull)');

/** Prioritizes verified AcrPull access, favoring identities in the app's resource group within that group. */
export class AcrPullManagedIdentityDefaultSortStrategy implements ManagedIdentityPickUpdateStrategy {
    public updatePicks(context: ManagedIdentityPickUpdateContext, picks: ManagedIdentityPick[]): ManagedIdentityPick[] {
        // Before the app exists, use its creation settings or environment to identify the relevant resource group.
        const resourceGroup = context.containerApp?.resourceGroup
            ?? context.resourceGroup?.name
            ?? context.newResourceGroupName
            ?? (context.managedEnvironment?.id ? parseAzureResourceId(context.managedEnvironment.id).resourceGroup : undefined);

        const sameResourceGroupAcrPullPicks: ManagedIdentityPick[] = [];
        const otherAcrPullPicks: ManagedIdentityPick[] = [];
        const appPicks: ManagedIdentityPick[] = [];
        const environmentPicks: ManagedIdentityPick[] = [];
        const sameResourceGroupPicks: ManagedIdentityPick[] = [];
        const otherPicks: ManagedIdentityPick[] = [];

        // Alphabetize and group
        for (const pick of [...picks].sort((a, b) => a.label.localeCompare(b.label))) {
            const identityResourceGroup = parseAzureResourceId(nonNullProp(pick.data.identity, 'id')).resourceGroup;
            const isSameResourceGroup = !!resourceGroup && identityResourceGroup.toLowerCase() === resourceGroup.toLowerCase();

            if (hasMatchingPickDescription(pick, acrPullPickDescription)) {
                pick.group = localize('hasAcrPullIdentityGroup', 'Has AcrPull');
                if (isSameResourceGroup) {
                    sameResourceGroupAcrPullPicks.push(pick);
                } else {
                    otherAcrPullPicks.push(pick);
                }
            } else if (pick.data.source === 'app') {
                pick.group = localize('appIdentityGroup', 'Attached to App');
                appPicks.push(pick);
            } else if (pick.data.source === 'environment') {
                pick.group = localize('environmentIdentityGroup', 'Attached to Environment');
                environmentPicks.push(pick);
            } else if (isSameResourceGroup) {
                pick.group = localize('sameRg', 'Within Same Resource Group');
                sameResourceGroupPicks.push(pick);
            } else {
                pick.group = localize('other', 'Other');
                otherPicks.push(pick);
            }
        }

        return [...sameResourceGroupAcrPullPicks, ...otherAcrPullPicks, ...appPicks, ...environmentPicks, ...sameResourceGroupPicks, ...otherPicks];
    }
}
