/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ContainerApp } from '@azure/arm-appcontainers';
import { getResourceGroupFromId } from '@microsoft/vscode-azext-azureutils';
import { AzureWizard, createSubscriptionContext, nonNullProp, nonNullValue, type IActionContext } from '@microsoft/vscode-azext-utils';
import { type AzureSubscription } from '@microsoft/vscode-azureresources-api';
import { ext } from '../../extensionVariables';
import { createActivityContext } from '../../utils/activityUtils';
import { createContainerAppsClient } from '../../utils/azureClients';
import { hasLogDestination } from '../../utils/hasLogDestination';
import { localize } from '../../utils/localize';
import { ManagedEnvironmentListStep } from '../createManagedEnvironment/ManagedEnvironmentListStep';
import { LogAnalyticsConnectStep } from './LogAnalyticsConnectStep';
import { type LogAnalyticsContext } from './LogAnalyticsContext';
import { LogAnalyticsListStep } from './LogAnalyticsListStep';

export async function connectLogAnalytics(context: IActionContext, node: { subscription: AzureSubscription; containerApp: ContainerApp }): Promise<void> {
    const { subscription, containerApp } = node;

    const client = await createContainerAppsClient(context, subscription);
    const environmentId = nonNullProp(containerApp, 'managedEnvironmentId');
    const managedEnvironment = await client.managedEnvironments.get(getResourceGroupFromId(environmentId), nonNullValue(environmentId.split('/').pop(), 'environmentName'));

    if (hasLogDestination(managedEnvironment.appLogsConfiguration)) {
        ext.state.notifyChildrenChanged(environmentId);
        return;
    }

    const wizardContext: LogAnalyticsContext = {
        ...context,
        ...createSubscriptionContext(subscription),
        ...await createActivityContext({ withChildren: true }),
        subscription,
        managedEnvironment,
    };
    await ManagedEnvironmentListStep.populateContextWithRelatedResources(wizardContext, managedEnvironment);

    const title = localize('connectLogAnalyticsTitle', 'Attach Log Analytics workspace to environment "{0}"', managedEnvironment.name);
    const wizard = new AzureWizard(wizardContext, {
        title,
        promptSteps: [new LogAnalyticsListStep()],
        executeSteps: [new LogAnalyticsConnectStep()],
        showLoadingPrompt: true,
    });

    await wizard.prompt();
    wizardContext.activityTitle = localize('connectLogAnalyticsActivityTitle', 'Attach log analytics workspace to environment "{0}"', managedEnvironment.name);
    await wizard.execute();

    ext.state.notifyChildrenChanged(environmentId);
}
