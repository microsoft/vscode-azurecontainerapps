/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type Workspace } from '@azure/arm-operationalinsights';
import { uiUtils } from '@microsoft/vscode-azext-azureutils';
import { AzureWizardPromptStep, type IAzureQuickPickItem } from '@microsoft/vscode-azext-utils';
import { createOperationalInsightsManagementClient } from '../../utils/azureClients';
import { localize } from '../../utils/localize';
import { nonNullProp } from '../../utils/nonNull';
import { type IManagedEnvironmentContext } from './IManagedEnvironmentContext';

export class LogAnalyticsListStep extends AzureWizardPromptStep<IManagedEnvironmentContext> {
    public async prompt(context: IManagedEnvironmentContext): Promise<void> {
        const placeHolder: string = localize('selectLogAnalytics', 'Select Log Analytics workspace. Your Log Analytics workspace will contain all your application logs.');
        context.logAnalyticsWorkspace = (await context.ui.showQuickPick(this.getQuickPicks(context), { placeHolder })).data;
    }

    public shouldPrompt(context: IManagedEnvironmentContext): boolean {
        return !context.logAnalyticsWorkspace;
    }

    private async getQuickPicks(context: IManagedEnvironmentContext): Promise<IAzureQuickPickItem<Workspace | undefined>[]> {
        const picks: IAzureQuickPickItem<Workspace | undefined>[] = [];

        picks.push({
            label: localize('newLogAnalytics', '$(plus) Create new Log Analytics workspace'),
            description: '',
            data: undefined
        });

        const opClient = await createOperationalInsightsManagementClient(context);
        const workspaces: Workspace[] = await uiUtils.listAllIterator(opClient.workspaces.list());

        return picks.concat(workspaces.map(ws => {
            return { label: nonNullProp(ws, 'name'), data: ws }
        }));
    }
}
