/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerApp, KubeEnvironment, WebSiteManagementClient } from "@azure/arm-appservice";
import { AzExtParentTreeItem, AzExtTreeItem, AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, IActionContext, ICreateChildImplContext, LocationListStep, TreeItemIconPath, VerifyProvidersStep } from "vscode-azureextensionui";
import { ContainerAppCreateStep } from "../commands/createContainerApp/ContainerAppCreateStep";
import { ContainerAppNameStep } from "../commands/createContainerApp/ContainerAppNameStep";
import { EnableIngressStep } from "../commands/createContainerApp/EnableIngressStep";
import { IContainerAppContext } from "../commands/createContainerApp/IContainerAppContext";
import { ContainerRegistryListStep } from "../commands/deployImage/ContainerRegistryListStep";
import { RegistryEnableAdminUserStep } from "../commands/deployImage/RegistryEnableAdminUserStep";
import { RegistryRepositoriesListStep } from "../commands/deployImage/RegistryRepositoriesListStep";
import { RepositoryTagListStep } from "../commands/deployImage/RepositoryTagListStep";
import { webProvider } from "../constants";
import { createWebSiteClient } from "../utils/azureClients";
import { getResourceGroupFromId } from "../utils/azureUtils";
import { localize } from "../utils/localize";
import { nonNullProp } from "../utils/nonNull";
import { treeUtils } from "../utils/treeUtils";
import { ContainerAppTreeItem } from "./ContainerAppTreeItem";
import { IAzureResourceTreeItem } from './IAzureResourceTreeItem';

export class KubeEnvironmentTreeItem extends AzExtParentTreeItem implements IAzureResourceTreeItem {
    public static contextValue: string = 'kubeEnvironment|azResource';
    public readonly contextValue: string = KubeEnvironmentTreeItem.contextValue;
    public readonly data: KubeEnvironment;
    public resourceGroupName: string;
    public readonly childTypeLabel: string = localize('containerApp', 'Container App');

    public name: string;
    public label: string;

    constructor(parent: AzExtParentTreeItem, ke: KubeEnvironment) {
        super(parent);
        this.data = ke;

        this.id = nonNullProp(this.data, 'id');
        this.resourceGroupName = getResourceGroupFromId(this.id);

        this.name = nonNullProp(this.data, 'name');
        this.label = this.name;

    }

    public get iconPath(): TreeItemIconPath {
        return treeUtils.getIconPath('Container App Environments placeholder icon icon');
    }

    public async loadMoreChildrenImpl(_clearCache: boolean, context: IActionContext): Promise<AzExtTreeItem[]> {
        const client: WebSiteManagementClient = await createWebSiteClient([context, this]);
        const containerApps: ContainerApp[] = [];
        // could be more efficient to call this once at Subscription level, and filter based off that
        // but then risk stale data
        for await (const ca of client.containerApps.listBySubscription()) {
            if (ca.kubeEnvironmentId && ca.kubeEnvironmentId === this.id) {
                containerApps.push(ca);
            }
        }

        return await this.createTreeItemsWithErrorHandling(
            containerApps,
            'invalidContainerApp',
            ca => new ContainerAppTreeItem(this, ca),
            ca => ca.name
        );
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }

    public async createChildImpl(context: ICreateChildImplContext): Promise<AzExtTreeItem> {
        const wizardContext: IContainerAppContext = { ...context, ...this.subscription };

        const title: string = localize('createContainerApp', 'Create Container App');
        const promptSteps: AzureWizardPromptStep<IContainerAppContext>[] =
            [new ContainerAppNameStep(), new ContainerRegistryListStep(), new RegistryEnableAdminUserStep(),
            new RegistryRepositoriesListStep(), new RepositoryTagListStep(), new EnableIngressStep()];
        const executeSteps: AzureWizardExecuteStep<IContainerAppContext>[] = [new VerifyProvidersStep([webProvider]), new ContainerAppCreateStep()];

        wizardContext.newResourceGroupName = this.resourceGroupName;
        await LocationListStep.setLocation(wizardContext, this.data.location);
        wizardContext.kubeEnvironmentId = this.id;

        const wizard: AzureWizard<IContainerAppContext> = new AzureWizard(wizardContext, {
            title,
            promptSteps,
            executeSteps,
            showLoadingPrompt: true
        });

        await wizard.prompt();
        await wizard.execute();

        return new ContainerAppTreeItem(this, nonNullProp(wizardContext, 'containerApp'));
    }

    // TODO: deleteTreeItemImpl
    // TODO: Create container logs
}
