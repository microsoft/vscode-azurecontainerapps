/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerAppsAPIClient, ManagedEnvironment } from "@azure/arm-appcontainers";
import { LocationListStep, ResourceGroupCreateStep, SubscriptionTreeItemBase, uiUtils, VerifyProvidersStep } from "@microsoft/vscode-azext-azureutils";
import { AzExtTreeItem, AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, IActionContext, ICreateChildImplContext } from '@microsoft/vscode-azext-utils';
import { IManagedEnvironmentContext } from '../commands/createManagedEnvironment/IManagedEnvironmentContext';
import { LogAnalyticsCreateStep } from '../commands/createManagedEnvironment/LogAnalyticsCreateStep';
import { ManagedEnvironmentCreateStep } from '../commands/createManagedEnvironment/ManagedEnvironmentCreateStep';
import { ManagedEnvironmentNameStep } from '../commands/createManagedEnvironment/ManagedEnvironmentNameStep';
import { createActivityContext } from "../utils/activityUtils";
import { createContainerAppsAPIClient } from '../utils/azureClients';
import { localize } from '../utils/localize';
import { nonNullProp } from '../utils/nonNull';
import { ManagedEnvironmentTreeItem } from './ManagedEnvironmentTreeItem';
import { ResolvedContainerEnvironmentResource } from "./ResolvedContainerAppsResource";

export class SubscriptionTreeItem extends SubscriptionTreeItemBase {
    public readonly childTypeLabel: string = localize('ManagedEnvironment', 'Container Apps environment');
    private readonly _nextLink: string | undefined;

    public hasMoreChildrenImpl(): boolean {
        return !!this._nextLink;
    }

    public async loadMoreChildrenImpl(_clearCache: boolean, context: IActionContext): Promise<AzExtTreeItem[]> {
        const client: ContainerAppsAPIClient = await createContainerAppsAPIClient([context, this]);
        const environments: ManagedEnvironment[] = await uiUtils.listAllIterator(client.managedEnvironments.listBySubscription());

        return await this.createTreeItemsWithErrorHandling(
            environments,
            'invalidManagedEnvironment',
            ke => new ManagedEnvironmentTreeItem(this, new ResolvedContainerEnvironmentResource(this.subscription, ke)),
            ke => ke.name
        );
    }

    public static async createChild(context: ICreateChildImplContext, node: SubscriptionTreeItemBase): Promise<ManagedEnvironmentTreeItem> {
        const wizardContext: IManagedEnvironmentContext = {
            ...context,
            ...node.subscription,
            ...(await createActivityContext())
        };

        const title: string = localize('createManagedEnv', 'Create Container Apps environment');
        const promptSteps: AzureWizardPromptStep<IManagedEnvironmentContext>[] = [];
        const executeSteps: AzureWizardExecuteStep<IManagedEnvironmentContext>[] = [];

        promptSteps.push(new ManagedEnvironmentNameStep());
        executeSteps.push(new VerifyProvidersStep(['Microsoft.App', 'Microsoft.OperationalInsights']), new ResourceGroupCreateStep(), new LogAnalyticsCreateStep(), new ManagedEnvironmentCreateStep());
        LocationListStep.addProviderForFiltering(wizardContext, 'Microsoft.App', 'managedEnvironments');
        LocationListStep.addStep(wizardContext, promptSteps);

        const wizard: AzureWizard<IManagedEnvironmentContext> = new AzureWizard(wizardContext, {
            title,
            promptSteps,
            executeSteps,
            showLoadingPrompt: true
        });

        await wizard.prompt();
        const newManagedEnvName = nonNullProp(wizardContext, 'newManagedEnvironmentName');
        wizardContext.newResourceGroupName = newManagedEnvName;
        wizardContext.activityTitle = localize('createNamedManagedEnv', 'Create Container Apps environment "{0}"', newManagedEnvName);
        await wizard.execute();

        const resolvedEnvironment = new ResolvedContainerEnvironmentResource(node.subscription, nonNullProp(wizardContext, 'managedEnvironment'));
        return new ManagedEnvironmentTreeItem(node, resolvedEnvironment);
    }
}
