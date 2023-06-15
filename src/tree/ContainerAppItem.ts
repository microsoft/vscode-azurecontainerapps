/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ContainerApp, ContainerAppsAPIClient, KnownActiveRevisionsMode } from "@azure/arm-appcontainers";
import { getResourceGroupFromId, uiUtils } from "@microsoft/vscode-azext-azureutils";
import { AzureWizard, DeleteConfirmationStep, IActionContext, callWithTelemetryAndErrorHandling, createSubscriptionContext, nonNullProp, nonNullValue } from "@microsoft/vscode-azext-utils";
import { AzureSubscription, ViewPropertiesModel } from "@microsoft/vscode-azureresources-api";
import { TreeItem, TreeItemCollapsibleState, Uri } from "vscode";
import { DeleteAllContainerAppsStep } from "../commands/deleteContainerApp/DeleteAllContainerAppsStep";
import { IDeleteContainerAppWizardContext } from "../commands/deleteContainerApp/IDeleteContainerAppWizardContext";
import { ext } from "../extensionVariables";
import { createActivityContext } from "../utils/activityUtils";
import { createContainerAppsAPIClient, createContainerAppsClient } from "../utils/azureClients";
import { createPortalUrl } from "../utils/createPortalUrl";
import { localize } from "../utils/localize";
import { treeUtils } from "../utils/treeUtils";
import { ContainerAppsItem, TreeElementBase } from "./ContainerAppsBranchDataProvider";
import { LogsItem } from "./LogsItem";
import { ConfigurationItem } from "./configurations/ConfigurationItem";
import { RevisionItem } from "./revisionManagement/RevisionItem";
import { RevisionsItem } from "./revisionManagement/RevisionsItem";

export interface ContainerAppModel extends ContainerApp {
    id: string;
    name: string;
    resourceGroup: string;
    managedEnvironmentId: string;
    revisionsMode: KnownActiveRevisionsMode;
}

export class ContainerAppItem implements ContainerAppsItem {
    public static contextValue: string = 'containerApp';
    public static contextValueRegExp: RegExp = new RegExp(ContainerAppItem.contextValue);

    id: string;

    private resourceGroup: string;
    private name: string;


    public get containerApp(): ContainerAppModel {
        return this._containerApp;
    }

    constructor(public readonly subscription: AzureSubscription, private _containerApp: ContainerAppModel) {
        this.id = this.containerApp.id;
        this.resourceGroup = this.containerApp.resourceGroup;
        this.name = this.containerApp.name;
    }

    viewProperties: ViewPropertiesModel = {
        data: this.containerApp,
        label: this.containerApp.name,
    }

    portalUrl: Uri = createPortalUrl(this.subscription, this.containerApp.id);

    async getChildren(): Promise<TreeElementBase[]> {
        const result = await callWithTelemetryAndErrorHandling('getChildren', async (context) => {
            const children: TreeElementBase[] = [];
            const client: ContainerAppsAPIClient = await createContainerAppsAPIClient([context, createSubscriptionContext(this.subscription)]);

            if (this.containerApp.revisionsMode === KnownActiveRevisionsMode.Multiple) {
                children.push(new RevisionsItem(this.subscription, this.containerApp));
            } else {
                const revisionData = await client.containerAppsRevisions.getRevision(this.resourceGroup, this.name, nonNullProp(this.containerApp, 'latestRevisionName'));
                children.push(new RevisionItem(this.subscription, this.containerApp, revisionData));
            }

            children.push(new ConfigurationItem(this.subscription, this.containerApp));
            children.push(new LogsItem(this.subscription, this.containerApp));
            return children;
        });

        return result ?? [];
    }

    getTreeItem(): TreeItem {
        return {
            id: this.id,
            label: nonNullProp(this.containerApp, 'name'),
            iconPath: treeUtils.getIconPath('azure-containerapps'),
            contextValue: `containerApp|revisionmode:${this.containerApp.revisionsMode}`,
            description: this.containerApp.provisioningState === 'Succeeded' ? undefined : this.containerApp.provisioningState,
            collapsibleState: TreeItemCollapsibleState.Collapsed,
        }
    }

    static async List(context: IActionContext, subscription: AzureSubscription, managedEnvironmentId: string): Promise<ContainerAppModel[]> {
        const subContext = createSubscriptionContext(subscription);
        const client: ContainerAppsAPIClient = await createContainerAppsAPIClient([context, subContext]);
        return (await uiUtils.listAllIterator(client.containerApps.listBySubscription()))
            .filter(ca => ca.managedEnvironmentId && ca.managedEnvironmentId === managedEnvironmentId)
            .map(ContainerAppItem.CreateContainerAppModel);
    }

    static async Get(context: IActionContext, subscription: AzureSubscription, resourceGroupName: string, containerAppName: string): Promise<ContainerAppModel> {
        const client: ContainerAppsAPIClient = await createContainerAppsClient(context, subscription);
        return ContainerAppItem.CreateContainerAppModel(await client.containerApps.get(resourceGroupName, containerAppName));
    }

    static CreateContainerAppModel(containerApp: ContainerApp): ContainerAppModel {
        const revisionsMode = containerApp.configuration?.activeRevisionsMode as KnownActiveRevisionsMode ?? KnownActiveRevisionsMode.Single;
        return {
            id: nonNullProp(containerApp, 'id'),
            name: nonNullProp(containerApp, 'name'),
            managedEnvironmentId: nonNullProp(containerApp, 'managedEnvironmentId'),
            resourceGroup: getResourceGroupFromId(nonNullProp(containerApp, 'id')),
            revisionsMode,
            ...containerApp,
        }
    }

    async delete(context: IActionContext & { suppressPrompt?: boolean }): Promise<void> {
        const confirmMessage: string = localize('confirmDeleteContainerApp', 'Are you sure you want to delete container app "{0}"?', this.name);
        const deleteContainerApp: string = localize('deleteContainerApp', 'Delete Container App "{0}"', this.name);

        const wizardContext: IDeleteContainerAppWizardContext = {
            activityTitle: deleteContainerApp,
            containerAppNames: this.name,
            subscription: createSubscriptionContext(this.subscription),
            resourceGroupName: this.resourceGroup,
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

        await ext.state.showDeleting(this.containerApp.id, async () => {
            await wizard.execute();
        });
        ext.state.notifyChildrenChanged(this.containerApp.managedEnvironmentId);
    }
}

export async function getContainerEnvelopeWithSecrets(context: IActionContext, subscription: AzureSubscription, containerApp: ContainerAppModel): Promise<Required<ContainerApp>> {
    // anytime you want to update the container app, you need to include the secrets but that is not retrieved by default
    // make a deep copy, we don't want to modify the one that is cached
    const containerAppEnvelope = <ContainerApp>JSON.parse(JSON.stringify(containerApp));

    // verify all top-level properties
    for (const key of Object.keys(containerAppEnvelope)) {
        // We know it's undefined but we want it to throw the error
        if (containerAppEnvelope[key] === undefined) {
            nonNullValue(containerAppEnvelope[key]);
        }

        containerAppEnvelope[key] = containerAppEnvelope[<keyof ContainerApp>key];
    }

    const concreteContainerAppEnvelope = <Required<ContainerApp>>containerAppEnvelope;
    const webClient: ContainerAppsAPIClient = await createContainerAppsAPIClient([context, createSubscriptionContext(subscription)]);

    concreteContainerAppEnvelope.configuration.secrets = ((await webClient.containerApps.listSecrets(containerApp.resourceGroup, containerApp.name)).value);
    concreteContainerAppEnvelope.configuration.registries ||= [];

    return concreteContainerAppEnvelope;
}

export function isIngressEnabled(containerApp: ContainerApp): containerApp is IngressEnabledContainerApp {
    return !!containerApp.configuration?.ingress?.fqdn;
}

type IngressEnabledContainerApp = ContainerApp & { configuration: { ingress: { fqdn: string } } };
