/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerApp, KubeEnvironment, WebSiteManagementClient } from "@azure/arm-appservice";
import { AzExtParentTreeItem, AzExtTreeItem, AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, IActionContext, ICreateChildImplContext, TreeItemIconPath, VerifyProvidersStep } from "vscode-azureextensionui";
import { IContainerAppContext } from "../commands/createContainerApp/IContainerAppContext";
import { createWebSiteClient } from "../utils/azureClients";
import { getResourceGroupFromId } from "../utils/azureUtils";
import { localize } from "../utils/localize";
import { nonNullProp } from "../utils/nonNull";
import { treeUtils } from "../utils/treeUtils";
import { ContainerAppTreeItem } from "./ContainerAppTreeItem";
import { IAzureResourceTreeItem } from './IAzureResourceTreeItem';

export class KubeEnvironmentTreeItem extends AzExtParentTreeItem implements IAzureResourceTreeItem {
    public static contextValue: string = 'kubeEnvironment';
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
        // TODO: need proper icon
        return treeUtils.getIconPath('azure-containerapps');
    }

    public async loadMoreChildrenImpl(_clearCache: boolean, context: IActionContext): Promise<AzExtTreeItem[]> {
        const client: WebSiteManagementClient = await createWebSiteClient([context, this]);
        const containerApps: ContainerApp[] = [];
        for await (const ca of client.containerApps.listByResourceGroup(this.resourceGroupName)) {
            containerApps.push(ca);
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
        const promptSteps: AzureWizardPromptStep<IContainerAppContext>[] = [];
        const executeSteps: AzureWizardExecuteStep<IContainerAppContext>[] = [];

        // TODO: Confirm whether or not the provider is Microsoft.Web or Microsoft.Web/ContainerApps
        // TODO: Write prompt/execute steps to actually create resource

        const webProvider: string = 'Microsoft.Web';
        executeSteps.push(new VerifyProvidersStep([webProvider]));

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
