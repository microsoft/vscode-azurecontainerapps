/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ContainerApp, ContainerAppsAPIClient, KnownActiveRevisionsMode, Revision, Template } from "@azure/arm-appcontainers";
import { getResourceGroupFromId, uiUtils } from "@microsoft/vscode-azext-azureutils";
import { AzureWizard, DeleteConfirmationStep, IActionContext, callWithTelemetryAndErrorHandling, createContextValue, createSubscriptionContext, nonNullProp, nonNullValue } from "@microsoft/vscode-azext-utils";
import { AzureSubscription, ViewPropertiesModel } from "@microsoft/vscode-azureresources-api";
import * as deepEqual from "deep-eql";
import { TreeItem, TreeItemCollapsibleState, Uri } from "vscode";
import { DeleteAllContainerAppsStep } from "../commands/deleteContainerApp/DeleteAllContainerAppsStep";
import { IDeleteContainerAppWizardContext } from "../commands/deleteContainerApp/IDeleteContainerAppWizardContext";
import { revisionModeMultipleContextValue, revisionModeSingleContextValue, unsavedChangesFalseContextValue, unsavedChangesTrueContextValue } from "../constants";
import { ext } from "../extensionVariables";
import { createActivityContext } from "../utils/activity/activityUtils";
import { createContainerAppsAPIClient, createContainerAppsClient } from "../utils/azureClients";
import { createPortalUrl } from "../utils/createPortalUrl";
import { localize } from "../utils/localize";
import { treeUtils } from "../utils/treeUtils";
import type { ContainerAppsItem, TreeElementBase } from "./ContainerAppsBranchDataProvider";
import { LogsGroupItem } from "./LogsGroupItem";
import { ConfigurationItem } from "./configurations/ConfigurationItem";
import { RevisionsDraftModel } from "./revisionManagement/RevisionDraftItem";
import { RevisionItem } from "./revisionManagement/RevisionItem";
import { RevisionsItem } from "./revisionManagement/RevisionsItem";

export interface ContainerAppModel extends ContainerApp {
    id: string;
    name: string;
    resourceGroup: string;
    managedEnvironmentId: string;
    revisionsMode: KnownActiveRevisionsMode;
}

export class ContainerAppItem implements ContainerAppsItem, RevisionsDraftModel {
    static readonly contextValue: string = 'containerAppItem';
    static readonly contextValueRegExp: RegExp = new RegExp(ContainerAppItem.contextValue);

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

    private get contextValue(): string {
        const values: string[] = [ContainerAppItem.contextValue];
        values.push(this.containerApp.revisionsMode === KnownActiveRevisionsMode.Single ? revisionModeSingleContextValue : revisionModeMultipleContextValue);
        values.push(this.hasUnsavedChanges() ? unsavedChangesTrueContextValue : unsavedChangesFalseContextValue);
        return createContextValue(values);
    }

    private get description(): string | undefined {
        if (this.containerApp.revisionsMode === KnownActiveRevisionsMode.Single && this.hasUnsavedChanges()) {
            return localize('unsavedChanges', 'Unsaved changes');
        }

        if (this.containerApp.provisioningState && this.containerApp.provisioningState !== 'Succeeded') {
            return this.containerApp.provisioningState;
        }

        return undefined;
    }

    async getChildren(): Promise<TreeElementBase[]> {
        const result = await callWithTelemetryAndErrorHandling('getChildren', async (context) => {
            const children: TreeElementBase[] = [];
            const client: ContainerAppsAPIClient = await createContainerAppsAPIClient([context, createSubscriptionContext(this.subscription)]);

            if (this.containerApp.revisionsMode === KnownActiveRevisionsMode.Single) {
                const revision: Revision = await client.containerAppsRevisions.getRevision(this.resourceGroup, this.name, nonNullProp(this.containerApp, 'latestRevisionName'));
                children.push(...RevisionItem.getTemplateChildren(this.subscription, this.containerApp, revision));
            } else {
                children.push(new RevisionsItem(this.subscription, this.containerApp));
            }

            children.push(new ConfigurationItem(this.subscription, this.containerApp));
            children.push(new LogsGroupItem(this.subscription, this.containerApp));
            return children;
        });

        return result ?? [];
    }

    getTreeItem(): TreeItem {
        return {
            id: this.id,
            label: nonNullProp(this.containerApp, 'name'),
            iconPath: treeUtils.getIconPath('azure-containerapps'),
            contextValue: this.contextValue,
            description: this.description,
            collapsibleState: TreeItemCollapsibleState.Collapsed,
        }
    }

    static isContainerAppItem(item: unknown): item is ContainerAppItem {
        return typeof item === 'object' &&
            typeof (item as ContainerAppItem).contextValue === 'string' &&
            ContainerAppItem.contextValueRegExp.test((item as ContainerAppItem).contextValue);
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

    hasUnsavedChanges(): boolean {
        const draftTemplate: Template | undefined = ext.revisionDraftFileSystem.parseRevisionDraft(this);
        if (!draftTemplate) {
            return false;
        }

        return !deepEqual(this.containerApp.template, draftTemplate);
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

export function isIngressEnabled(containerApp: ContainerApp | ContainerAppModel): containerApp is IngressEnabledContainerApp {
    return !!containerApp.configuration?.ingress?.fqdn;
}

type IngressEnabledContainerApp = ContainerApp & { configuration: { ingress: { fqdn: string } } };
