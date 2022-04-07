/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ManagedEnvironment } from '@azure/arm-app';
import { Workspace } from '@azure/arm-operationalinsights';
import { uiUtils } from '@microsoft/vscode-azext-azureutils';
import { AzureWizardPromptStep, IAzureQuickPickItem } from '@microsoft/vscode-azext-utils';
import { createContainerAppsAPIClient } from '../../utils/azureClients';
import { localize } from '../../utils/localize';
import { nonNullProp } from '../../utils/nonNull';
import { IContainerAppContext } from './IContainerAppContext';

export class ManagedEnvironmentListStep extends AzureWizardPromptStep<IContainerAppContext> {
    public async prompt(context: IContainerAppContext): Promise<void> {
        const placeHolder: string = localize('selectManagedEnv', 'Select Container Apps environment.');
        context.managedEnvironment = (await context.ui.showQuickPick(this.getQuickPicks(context), { placeHolder })).data;
    }

    public shouldPrompt(context: IContainerAppContext): boolean {
        return !context.managedEnvironment;
    }

    private async getQuickPicks(context: IContainerAppContext): Promise<IAzureQuickPickItem<Workspace | undefined>[]> {
        const picks: IAzureQuickPickItem<Workspace | undefined>[] = [];

        picks.push({
            label: localize('newLogAnalytics', '$(plus) Create new Container Apps environment'),
            description: '',
            data: undefined
        });

        const appClient = await createContainerAppsAPIClient(context)
        const environments: ManagedEnvironment[] = await uiUtils.listAllIterator(appClient.managedEnvironments.listBySubscription());

        return picks.concat(environments.map(me => {
            return { label: nonNullProp(me, 'name'), data: me }
        }));
    }
}
