/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerAppsAPIClient } from '@azure/arm-appcontainers';
import { AzureWizardExecuteStep, nonNullProp } from '@microsoft/vscode-azext-utils';
import { Progress } from 'vscode';
import { createContainerAppsAPIClient } from '../../../utils/azureClients';
import { getResourceGroupFromId } from '../../../utils/azureUtils';
import { deleteUtil } from '../../../utils/deleteUtil';
import { localize } from '../../../utils/localize';
import { IDeleteWizardContext } from '../../IDeleteWizardContext';

export class AllContainerAppsDeleteStep extends AzureWizardExecuteStep<IDeleteWizardContext> {
    public priority: number = 140;
    public async execute(context: IDeleteWizardContext, progress: Progress<{ message?: string; increment?: number }>): Promise<void> {
        if (context.containerApps && context.containerApps.length > 0) {
            const client: ContainerAppsAPIClient = await createContainerAppsAPIClient([context, context.subscription]);
            const deletePromises = context.containerApps.map(async (c) => {
                await deleteUtil(async () => {
                    const resourceGroupName = getResourceGroupFromId(nonNullProp(c, 'id'));
                    const name = nonNullProp(c, 'name');
                    await client.containerApps.beginDeleteAndWait(resourceGroupName, name);
                    progress.report({ message: localize('deletedContainerApp', 'Successfully deleted container app "{0}".', name) });
                })
            });

            await Promise.all(deletePromises);
        }
    }

    public shouldExecute(): boolean {
        return true;
    }
}
