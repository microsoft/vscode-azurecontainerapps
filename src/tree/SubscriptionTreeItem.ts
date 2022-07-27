/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { LocationListStep, ResourceGroupCreateStep, SubscriptionTreeItemBase, VerifyProvidersStep } from "@microsoft/vscode-azext-azureutils";
import { AzExtTreeItem, AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, IActionContext, ICreateChildImplContext } from '@microsoft/vscode-azext-utils';
import { IManagedEnvironmentContext } from '../commands/createManagedEnvironment/IManagedEnvironmentContext';
import { LogAnalyticsCreateStep } from '../commands/createManagedEnvironment/LogAnalyticsCreateStep';
import { ManagedEnvironmentCreateStep } from '../commands/createManagedEnvironment/ManagedEnvironmentCreateStep';
import { ManagedEnvironmentNameStep } from '../commands/createManagedEnvironment/ManagedEnvironmentNameStep';
import { localize } from '../utils/localize';
import { nonNullProp } from '../utils/nonNull';
import { ResolvedContainerAppsResource } from './ResolvedContainerAppsResource';

export class SubscriptionTreeItem extends SubscriptionTreeItemBase {
    public readonly childTypeLabel: string = localize('ManagedEnvironment', 'Container Apps environment');
    private readonly _nextLink: string | undefined;

    public hasMoreChildrenImpl(): boolean {
        return !!this._nextLink;
    }

    public async loadMoreChildrenImpl(_clearCache: boolean, _context: IActionContext): Promise<AzExtTreeItem[]> {
        return [];
    }

    public async createChildImpl(context: ICreateChildImplContext): Promise<AzExtTreeItem> {
        const wizardContext: IManagedEnvironmentContext = { ...context, ...this.subscription };

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
        context.showCreatingTreeItem(newManagedEnvName);
        wizardContext.newResourceGroupName = newManagedEnvName;
        await wizard.execute();

        return new ResolvedContainerAppsResource(this, nonNullProp(wizardContext, 'managedEnvironment'));
    }
}

