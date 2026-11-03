/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type Workspace } from '@azure/arm-operationalinsights';
import { LocationListStep, ResourceGroupCreateStep, ResourceGroupListStep, uiUtils, VerifyProvidersStep } from '@microsoft/vscode-azext-azureutils';
import { AzureWizardPromptStep, nonNullProp, type IAzureQuickPickItem, type ISubscriptionActionContext, type IWizardOptions } from '@microsoft/vscode-azext-utils';
import { logAnalyticsProvider, logAnalyticsResourceType } from '../../constants';
import { createOperationalInsightsManagementClient } from '../../utils/azureClients';
import { localize } from '../../utils/localize';
import { StartingResourcesLogStep } from '../StartingResourcesLogStep';
import { type LogAnalyticsContext } from './LogAnalyticsContext';
import { LogAnalyticsCreateStep } from './LogAnalyticsCreateStep';
import { LogAnalyticsNameStep } from './LogAnalyticsNameStep';

export class LogAnalyticsListStep extends AzureWizardPromptStep<LogAnalyticsContext> {
    public async prompt(context: LogAnalyticsContext): Promise<void> {
        const workspaces = await LogAnalyticsListStep.getLogAnalyticsWorkspaces(context);
        const picks: IAzureQuickPickItem<Workspace | undefined>[] = workspaces.map(workspace => ({
            label: nonNullProp(workspace, 'name'),
            data: workspace,
        }));

        picks.unshift({
            label: localize('newLogAnalytics', '$(plus) Create new log analytics workspace'),
            data: undefined,
        });

        context.logAnalyticsWorkspace = (await context.ui.showQuickPick(picks, {
            placeHolder: localize('selectLogAnalytics', 'Select a log analytics workspace for this environment.'),
            suppressPersistence: true,
        })).data;
    }

    public shouldPrompt(context: LogAnalyticsContext): boolean {
        return !context.logAnalyticsWorkspace && !context.newLogAnalyticsWorkspaceName;
    }

    public async getSubWizard(context: LogAnalyticsContext): Promise<IWizardOptions<LogAnalyticsContext>> {
        const startingResourcesLogStep = new StartingResourcesLogStep<LogAnalyticsContext>({
            suppressManagedEnvironmentItem: true,
            suppressResourceGroupItem: !!context.logAnalyticsWorkspace,
        });

        if (context.logAnalyticsWorkspace) {
            return { promptSteps: [startingResourcesLogStep] };
        }

        const promptSteps: AzureWizardPromptStep<LogAnalyticsContext>[] = [new LogAnalyticsNameStep()];
        LocationListStep.addProviderForFiltering(context, logAnalyticsProvider, logAnalyticsResourceType);

        if (!context.resourceGroup && !context.newResourceGroupName) {
            promptSteps.push(new ResourceGroupListStep());
        }

        LocationListStep.addStep(context, promptSteps);
        promptSteps.push(startingResourcesLogStep);

        return {
            promptSteps,
            executeSteps: [
                new VerifyProvidersStep([logAnalyticsProvider]),
                new ResourceGroupCreateStep(),
                new LogAnalyticsCreateStep(),
            ],
        };
    }

    public static async getLogAnalyticsWorkspaces(context: ISubscriptionActionContext): Promise<Workspace[]> {
        const client = await createOperationalInsightsManagementClient(context);
        return await uiUtils.listAllIterator(client.workspaces.list());
    }
}
