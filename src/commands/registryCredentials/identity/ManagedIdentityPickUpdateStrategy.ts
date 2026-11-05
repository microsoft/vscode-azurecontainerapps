/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type Identity } from '@azure/arm-msi';
import { type IAzureQuickPickItem } from '@microsoft/vscode-azext-utils';

export interface ManagedIdentitySelection {
    identity: Identity;
    source: 'app' | 'environment' | 'existing';
}

export type ManagedIdentityPick = IAzureQuickPickItem<ManagedIdentitySelection>;

export interface ManagedIdentityPickUpdateContext {
    containerApp?: { resourceGroup: string };
    resourceGroup?: { name?: string };
    newResourceGroupName?: string;
    managedEnvironment?: { id?: string };
}

export interface ManagedIdentityPickUpdateStrategy {
    updatePicks(context: ManagedIdentityPickUpdateContext, picks: ManagedIdentityPick[]): ManagedIdentityPick[] | Promise<ManagedIdentityPick[]>;
}
