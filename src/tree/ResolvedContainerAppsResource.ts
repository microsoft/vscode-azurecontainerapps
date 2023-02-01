/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerApp, ContainerAppsAPIClient, ManagedEnvironment } from "@azure/arm-appcontainers";
import { getResourceGroupFromId, LocationListStep, uiUtils, VerifyProvidersStep } from "@microsoft/vscode-azext-azureutils";
import { AzExtTreeItem, AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, IActionContext, ICreateChildImplContext, ISubscriptionContext } from "@microsoft/vscode-azext-utils";
import { ResolvedAppResourceBase } from "@microsoft/vscode-azext-utils/hostapi";
import { ContainerAppCreateStep } from "../commands/createContainerApp/ContainerAppCreateStep";
import { ContainerAppNameStep } from "../commands/createContainerApp/ContainerAppNameStep";
import { EnableIngressStep } from "../commands/createContainerApp/EnableIngressStep";
import { EnvironmentVariablesListStep } from "../commands/createContainerApp/EnvironmentVariablesListStep";
import { IContainerAppContext, IContainerAppWithActivityContext } from "../commands/createContainerApp/IContainerAppContext";
import { DeleteAllContainerAppsStep } from "../commands/deleteContainerApp/DeleteAllContainerAppsStep";
import { DeleteEnvironmentConfirmationStep } from "../commands/deleteManagedEnvironment/DeleteEnvironmentConfirmationStep";
import { DeleteManagedEnvironmentStep } from "../commands/deleteManagedEnvironment/DeleteManagedEnvironmentStep";
import { IDeleteManagedEnvironmentWizardContext } from "../commands/deleteManagedEnvironment/IDeleteManagedEnvironmentWizardContext";
import { ContainerRegistryListStep } from "../commands/deployImage/ContainerRegistryListStep";
import { azResourceContextValue, webProvider } from "../constants";
import { createActivityContext } from "../utils/activityUtils";
import { createContainerAppsAPIClient } from "../utils/azureClients";
import { localize } from "../utils/localize";
import { nonNullProp } from "../utils/nonNull";
import { ContainerAppTreeItem } from "./ContainerAppTreeItem";
import { IAzureResource } from "./IAzureResourceTreeItem";
import { ManagedEnvironmentTreeItem } from "./ManagedEnvironmentTreeItem";

export class ResolvedContainerEnvironmentResource implements ResolvedAppResourceBase, IAzureResource {
    public static contextValue: string = 'containerEnvironment';
    public static contextValueRegExp: RegExp = new RegExp(ResolvedContainerEnvironmentResource.contextValue);
    public resolvedContextValue: string = `${ResolvedContainerEnvironmentResource.contextValue}|${azResourceContextValue}`;
    public contextValuesToAdd: string[] = [];

    public readonly data: ManagedEnvironment;
    public resourceGroupName: string;
    public readonly childTypeLabel: string = localize('containerApp', 'Container App');

    public name: string;
    public label: string;

    public constructor(private readonly _subscription: ISubscriptionContext, ke: ManagedEnvironment) {
        this.data = ke;

        this.resourceGroupName = getResourceGroupFromId(this.id);
        this.name = nonNullProp(this.data, 'name');
        this.label = this.name;

        this.contextValuesToAdd.push(this.resolvedContextValue);
    }

    public get id(): string {
        return nonNullProp(this.data, 'id');
    }

    public async loadMoreChildrenImpl(_clearCache: boolean, context: IActionContext): Promise<AzExtTreeItem[]> {
        const proxyTree: ManagedEnvironmentTreeItem = this as unknown as ManagedEnvironmentTreeItem;
        const client: ContainerAppsAPIClient = await createContainerAppsAPIClient([context, this._subscription]);
        // could be more efficient to call this once at Subscription level, and filter based off that but then risk stale data
        const containerApps: ContainerApp[] = (await uiUtils.listAllIterator(client.containerApps.listBySubscription()))
            .filter(ca => ca.managedEnvironmentId && ca.managedEnvironmentId === this.id)

        return await proxyTree.createTreeItemsWithErrorHandling(
            containerApps,
            'invalidContainerApp',
            ca => new ContainerAppTreeItem(proxyTree, ca),
            ca => ca.name
        );
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }

    public async createChildImpl(context: ICreateChildImplContext): Promise<AzExtTreeItem> {
        const proxyTree: ManagedEnvironmentTreeItem = this as unknown as ManagedEnvironmentTreeItem;
        const wizardContext: IContainerAppContext = {
            ...context, ...this._subscription, managedEnvironmentId: this.id
        };

        const title: string = localize('createContainerApp', 'Create Container App');
        const promptSteps: AzureWizardPromptStep<IContainerAppWithActivityContext>[] =
            [new ContainerAppNameStep(), new ContainerRegistryListStep(), new EnvironmentVariablesListStep(), new EnableIngressStep()];
        const executeSteps: AzureWizardExecuteStep<IContainerAppWithActivityContext>[] = [new VerifyProvidersStep([webProvider]), new ContainerAppCreateStep()];

        wizardContext.telemetry.properties['x-ms-correlation-request-id'] = 'asdabvadsf9w348wre9r3';
        wizardContext.newResourceGroupName = this.resourceGroupName;
        await LocationListStep.setLocation(wizardContext, this.data.location);

        const wizard: AzureWizard<IContainerAppWithActivityContext> = new AzureWizard(wizardContext, {
            title,
            promptSteps,
            executeSteps,
            showLoadingPrompt: true
        });

        await wizard.prompt();
        const newContainerAppName = nonNullProp(wizardContext, 'newContainerAppName');
        context.showCreatingTreeItem(newContainerAppName);
        // wizardContext.activityTitle = localize('createNamedContainerApp', 'Create Container App "{0}"', newContainerAppName);
        try {
            await wizard.execute();
        } finally {
            // refresh this node even if create fails because container app provision failure throws an error, but still creates a container app
            await proxyTree.refresh(context);
        }

        return new ContainerAppTreeItem(proxyTree, nonNullProp(wizardContext, 'containerApp'));
    }

    public async deleteTreeItemImpl(context: IActionContext & { suppressPrompt?: boolean }): Promise<void> {
        const proxyTree: ManagedEnvironmentTreeItem = this as unknown as ManagedEnvironmentTreeItem;
        const containerApps = <ContainerAppTreeItem[]>(await proxyTree.loadAllChildren(context));

        const deleteManagedEnvironment: string = localize('deleteManagedEnvironment', 'Delete Container Apps Environment "{0}"', proxyTree.name);

        const wizardContext: IDeleteManagedEnvironmentWizardContext = {
            activityTitle: deleteManagedEnvironment,
            containerAppNames: containerApps.map(ca => ca.name),
            managedEnvironmentName: proxyTree.name,
            resourceGroupName: proxyTree.resourceGroupName,
            subscription: proxyTree.subscription,
            ...context,
            ...(await createActivityContext())
        };
        const wizard: AzureWizard<IDeleteManagedEnvironmentWizardContext> = new AzureWizard(wizardContext, {
            promptSteps: [new DeleteEnvironmentConfirmationStep()],
            executeSteps: [new DeleteAllContainerAppsStep(), new DeleteManagedEnvironmentStep()]
        });

        if (!context.suppressPrompt) {
            await wizard.prompt();
        }
        await wizard.execute();
    }
}
