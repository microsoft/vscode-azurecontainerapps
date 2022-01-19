/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KubeEnvironment, WebSiteManagementClient } from '@azure/arm-appservice';
import { AzExtTreeItem, AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, IActionContext, ICreateChildImplContext, ResourceGroupListStep, SubscriptionTreeItemBase, VerifyProvidersStep } from 'vscode-azureextensionui';
import { IKubeEnvironmentContext } from '../commands/createKubeEnvironment/IKubeEnvironmentContext';
import { KubeEnvironmentNameStep } from '../commands/createKubeEnvironment/KubeEnvironmentNameStep';
import { LogAnalyticsListStep } from '../commands/createKubeEnvironment/LogAnalyticsListStep';
import { webProvider } from '../constants';
import { createWebSiteClient } from '../utils/azureClients';
import { localize } from '../utils/localize';
import { nonNullProp } from '../utils/nonNull';
import { KubeEnvironmentTreeItem } from './KubeEnvironmentTreeItem';

export class SubscriptionTreeItem extends SubscriptionTreeItemBase {
    public readonly childTypeLabel: string = localize('kubeEnvironment', 'Kubernetes Environment');
    private readonly _nextLink: string | undefined;

    public hasMoreChildrenImpl(): boolean {
        return !!this._nextLink;
    }

    public async loadMoreChildrenImpl(_clearCache: boolean, context: IActionContext): Promise<AzExtTreeItem[]> {
        const client: WebSiteManagementClient = await createWebSiteClient([context, this]);
        const environments: KubeEnvironment[] = [];
        for await (const env of client.kubeEnvironments.listBySubscription()) {
            environments.push(env);
        }

        return await this.createTreeItemsWithErrorHandling(
            environments,
            'invalidKubeEnvironment',
            ke => new KubeEnvironmentTreeItem(this, ke),
            ke => ke.name
        );

    }

    public async createChildImpl(context: ICreateChildImplContext): Promise<AzExtTreeItem> {
        const wizardContext: IKubeEnvironmentContext = { ...context, ...this.subscription };

        const title: string = localize('createKubeEnv', 'Create Kubernetes Environment');
        const promptSteps: AzureWizardPromptStep<IKubeEnvironmentContext>[] = [];
        const executeSteps: AzureWizardExecuteStep<IKubeEnvironmentContext>[] = [];

        // TODO: Confirm whether or not the provider is Microsoft.Web or Microsoft.Web/kubeenvironments
        // TODO: Write prompt/execute steps to actually create resource

        promptSteps.push(new ResourceGroupListStep(), new KubeEnvironmentNameStep(), new LogAnalyticsListStep());
        executeSteps.push(new VerifyProvidersStep([webProvider]));

        const wizard: AzureWizard<IKubeEnvironmentContext> = new AzureWizard(wizardContext, {
            title,
            promptSteps,
            executeSteps,
            showLoadingPrompt: true
        });

        await wizard.prompt();
        await wizard.execute();

        return new KubeEnvironmentTreeItem(this, nonNullProp(wizardContext, 'kubeEnvironment'));
    }
}

