/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Workspace } from '@azure/arm-operationalinsights';
import { AzureWizardPromptStep, IAzureQuickPickItem, IWizardOptions } from 'vscode-azureextensionui';
import { createOperationalInsightsManagementClient } from '../../utils/azureClients';
import { localize } from '../../utils/localize';
import { nonNullProp } from '../../utils/nonNull';
import { IKubeEnvironmentContext } from './IKubeEnvironmentContext';
import { LogAnalyticsCreateStep } from './LogAnalyticsCreateStep';

export class LogAnalyticsListStep extends AzureWizardPromptStep<IKubeEnvironmentContext> {
    public async prompt(context: IKubeEnvironmentContext): Promise<void> {
        const placeHolder: string = localize('selectLogAnalytics', 'Select Log Analytics workspace. Your Log Analytics workspace will contain all your application logs.');
        context.logAnalyticsWorkspace = (await context.ui.showQuickPick(await this.getQuickPicks(context), { placeHolder })).data;
    }

    public shouldPrompt(context: IKubeEnvironmentContext): boolean {
        return !context.logAnalyticsWorkspace;
    }

    public async getSubWizard(): Promise<IWizardOptions<IKubeEnvironmentContext>> {
        return {
            promptSteps: [],
            executeSteps: [new LogAnalyticsCreateStep()]
        };
    }

    private async getQuickPicks(context: IKubeEnvironmentContext): Promise<IAzureQuickPickItem<OperationalInsightsManagementModels.Workspace | undefined>[]> {
        const picks: IAzureQuickPickItem<OperationalInsightsManagementModels.Workspace | undefined>[] = [];

        picks.push({
            label: localize('newLogAnalytics', '$(plus) Create new Log Analytics workspace'),
            description: '',
            data: undefined
        });

        const opClient = createOperationalInsightsManagementClient(context);

        const containerApps: Workspace[] = [];
        // could be more efficient to call this once at Subscription level, and filter based off that
        // but then risk stale data
        for await (const ca of client.containerApps.listBySubscription()) {
            if (ca.kubeEnvironmentId && ca.kubeEnvironmentId === this.id) {
                containerApps.push(ca);
            }
        }
        return picks.concat((await opClient.workspaces.list()).map(ws => {
            return { label: nonNullProp(ws, 'name'), data: ws }
        }));
    }
}
