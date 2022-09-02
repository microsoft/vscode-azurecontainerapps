/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerApp, ContainerAppsAPIClient } from "@azure/arm-appcontainers";
import { getResourceGroupFromId } from "@microsoft/vscode-azext-azureutils";
import { AzExtParentTreeItem, AzExtTreeItem, AzureWizard, DeleteConfirmationStep, IActionContext, TreeItemIconPath } from "@microsoft/vscode-azext-utils";
import { DeleteAllContainerAppsStep } from "../commands/deleteContainerApp/DeleteAllContainerAppsStep";
import { IDeleteContainerAppWizardContext } from "../commands/deleteContainerApp/IDeleteContainerAppWizardContext";
import { azResourceContextValue, RevisionConstants } from "../constants";
import { createActivityContext } from "../utils/activityUtils";
import { createContainerAppsAPIClient } from "../utils/azureClients";
import { localize } from "../utils/localize";
import { nonNullProp } from "../utils/nonNull";
import { openUrl } from "../utils/openUrl";
import { treeUtils } from "../utils/treeUtils";
import { DaprTreeItem } from "./DaprTreeItem";
import { IAzureResourceTreeItem } from './IAzureResourceTreeItem';
import { IngressDisabledTreeItem, IngressTreeItem } from "./IngressTreeItem";
import { LogsTreeItem } from "./LogsTreeItem";
import { RevisionsTreeItem } from "./RevisionsTreeItem";
import { RevisionTreeItem } from "./RevisionTreeItem";
import { ScaleTreeItem } from "./ScaleTreeItem";

export class ContainerAppTreeItem extends AzExtParentTreeItem implements IAzureResourceTreeItem {
    public static contextValue: string = 'containerApp';
    public static contextValueRegExp: RegExp = new RegExp(ContainerAppTreeItem.contextValue);
    public contextValue: string;
    public data: ContainerApp;
    public resourceGroupName: string;

    public name: string;
    public label: string;
    public childTypeLabel: string = localize('containerAppSetting', 'Container App setting');
    public managedEnvironmentId: string;

    public revisionsTreeItem: RevisionsTreeItem;
    public ingressTreeItem: IngressTreeItem | IngressDisabledTreeItem;
    public logTreeItem: LogsTreeItem;
    public scaleTreeItem: ScaleTreeItem;

    constructor(parent: AzExtParentTreeItem, ca: ContainerApp) {
        super(parent);
        this.data = ca;

        this.id = nonNullProp(this.data, 'id');
        this.resourceGroupName = getResourceGroupFromId(this.id);

        this.name = nonNullProp(this.data, 'name');
        this.label = this.name;
        this.managedEnvironmentId = nonNullProp(this.data, 'managedEnvironmentId');

        this.contextValue = `${ContainerAppTreeItem.contextValue}|${azResourceContextValue}|revisionmode:${this.getRevisionMode()}`;
    }

    public get iconPath(): TreeItemIconPath {
        return treeUtils.getIconPath('azure-containerapps');
    }

    public get description(): string | undefined {
        return this.data.provisioningState === 'Succeeded' ? undefined : this.data.provisioningState;
    }

    public async loadMoreChildrenImpl(_clearCache: boolean, context: IActionContext): Promise<AzExtTreeItem[]> {
        const children: AzExtTreeItem[] = [new DaprTreeItem(this, this.data.configuration?.dapr)];
        await this.updateChildren(context);
        if (this.getRevisionMode() === RevisionConstants.multiple.data) {
            children.push(this.revisionsTreeItem);
        } else {
            children.push(this.scaleTreeItem);
        }

        children.push(this.ingressTreeItem, this.logTreeItem)
        return children;
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }

    public compareChildrenImpl(): number {
        return 0;
    }

    public async browse(): Promise<void> {
        // make sure that ingress is enabled
        if (!this.ingressEnabled() || !this.data.configuration?.ingress?.fqdn) {
            throw new Error(localize('enableIngress', 'Enable ingress to perform this action.'));
        }

        await openUrl(`https://${this.data.configuration?.ingress?.fqdn}`);
    }

    public async deleteTreeItemImpl(context: IActionContext & { suppressPrompt?: boolean }): Promise<void> {
        const confirmMessage: string = localize('confirmDeleteContainerApp', 'Are you sure you want to delete container app "{0}"?', this.name);
        const deleteContainerApp: string = localize('deleteContainerApp', 'Delete Container App "{0}"', this.name);

        const wizardContext: IDeleteContainerAppWizardContext = {
            activityTitle: deleteContainerApp,
            containerAppNames: this.name,
            subscription: this.subscription,
            resourceGroupName: this.resourceGroupName,
            ...context,
            ...(await createActivityContext())
        };
        const wizard: AzureWizard<IDeleteContainerAppWizardContext> = new AzureWizard(wizardContext, {
            promptSteps: [new DeleteConfirmationStep(confirmMessage)],
            executeSteps: [new DeleteAllContainerAppsStep()]
        });

        if (!context.suppressPrompt) {
            await wizard.prompt();
        }
        await wizard.execute();
    }

    public async refreshImpl(context: IActionContext): Promise<void> {
        const client: ContainerAppsAPIClient = await createContainerAppsAPIClient([context, this]);
        const data = await client.containerApps.get(this.resourceGroupName, this.name);

        this.contextValue = `${ContainerAppTreeItem.contextValue}|${azResourceContextValue}|revisionmode:${this.getRevisionMode()}`;
        this.data = data;

        await this.updateChildren(context);
    }

    public async updateChildren(context: IActionContext): Promise<void> {
        if (this.getRevisionMode() === RevisionConstants.multiple.data) {
            this.revisionsTreeItem = new RevisionsTreeItem(this);
        }

        const client: ContainerAppsAPIClient = await createContainerAppsAPIClient([context, this]);
        const revisionData = await client.containerAppsRevisions.getRevision(this.resourceGroupName, this.name, nonNullProp(this.data, 'latestRevisionName'));
        this.scaleTreeItem = new ScaleTreeItem(this, revisionData.template?.scale);

        this.ingressTreeItem = this.data.configuration?.ingress ? new IngressTreeItem(this, this.data.configuration?.ingress) : new IngressDisabledTreeItem(this);
        this.logTreeItem = new LogsTreeItem(this);
    }

    public pickTreeItemImpl(expectedContextValues: (string | RegExp)[]): AzExtTreeItem | undefined {
        for (const expectedContextValue of expectedContextValues) {
            if (expectedContextValue instanceof RegExp) {
                if (expectedContextValue.test(ScaleTreeItem.contextValue)) {
                    return this.getRevisionMode() === RevisionConstants.single.data ? this.scaleTreeItem : this.revisionsTreeItem;
                }
            } else {
                switch (expectedContextValue) {
                    case RevisionTreeItem.contextValue:
                    case RevisionsTreeItem.contextValue:
                        return this.revisionsTreeItem;
                    case IngressTreeItem.contextValue:
                    case IngressDisabledTreeItem.contextValue:
                        return this.ingressTreeItem;
                    case LogsTreeItem.contextValue:
                        return this.logTreeItem;
                    case ScaleTreeItem.contextValue:
                        return this.scaleTreeItem;
                    default:
                }
            }
        }

        return undefined;
    }

    public async getContainerEnvelopeWithSecrets(context: IActionContext): Promise<Required<ContainerApp>> {
        // anytime you want to update the container app, you need to include the secrets but that is not retrieved by default
        // make a deep copy, we don't want to modify the one that is cached
        const containerAppEnvelope = <ContainerApp>JSON.parse(JSON.stringify(this.data));

        // verify all top-level properties
        for (const key of Object.keys(containerAppEnvelope)) {
            containerAppEnvelope[key] = nonNullProp(containerAppEnvelope, <keyof ContainerApp>key);
        }

        const concreteContainerAppEnvelope = <Required<ContainerApp>>containerAppEnvelope;
        const webClient: ContainerAppsAPIClient = await createContainerAppsAPIClient([context, this]);

        concreteContainerAppEnvelope.configuration.secrets = ((await webClient.containerApps.listSecrets(this.resourceGroupName, this.name)).value);
        concreteContainerAppEnvelope.configuration.registries ||= [];

        return concreteContainerAppEnvelope;
    }

    public getRevisionMode(): string {
        return this.data.configuration?.activeRevisionsMode?.toLowerCase() === 'single' ?
            RevisionConstants.single.data : RevisionConstants.multiple.data;
    }

    public ingressEnabled(): boolean {
        return !!this.data.configuration?.ingress;
    }
}

