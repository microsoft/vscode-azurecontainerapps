/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createManagedServiceIdentityClient, parseAzureResourceId, UserAssignedIdentityCreateStep } from '@microsoft/vscode-azext-azureutils';
import { nonNullProp, nonNullValueAndProp } from '@microsoft/vscode-azext-utils';
import { type Progress } from 'vscode';
import { localize } from '../../../utils/localize';
import { type ManagedIdentityRegistryCredentialsContext } from './ManagedIdentityRegistryCredentialsContext';

export class ManagedIdentityCreateStep<T extends ManagedIdentityRegistryCredentialsContext> extends UserAssignedIdentityCreateStep<T> {
    public priority: number = 440;

    public async configureBeforeExecute(context: T): Promise<void> {
        if (context.managedIdentity) {
            return;
        }

        // Generate the default name from the environment's resource group, then copy it back from the temporary context.
        const identityContext = this.getIdentityContext(context);
        await super.configureBeforeExecute?.(identityContext);
        context.newManagedIdentityName = identityContext.newManagedIdentityName;
    }

    public async execute(context: T, progress: Progress<{ message?: string; increment?: number }>): Promise<void> {
        progress.report({ message: localize('creatingUserAssignedIdentity', 'Creating user-assigned identity...') });

        const identityContext = this.getIdentityContext(context);
        const client = await createManagedServiceIdentityClient(context);

        context.managedIdentity = await client.userAssignedIdentities.createOrUpdate(
            nonNullProp(identityContext, 'newResourceGroupName'),
            nonNullProp(context, 'newManagedIdentityName'),
            { location: nonNullValueAndProp(context.managedEnvironment, 'location') },
        );
    }

    // shouldExecute(): !context.managedIdentity

    private getIdentityContext(context: T): T {
        const { resourceGroup } = parseAzureResourceId(nonNullProp(nonNullProp(context, 'managedEnvironment'), 'id'));
        return {
            ...context,
            resourceGroup: { name: resourceGroup },
            newResourceGroupName: resourceGroup,
        };
    }
}
