/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerApp, ContainerAppsAPIClient, ManagedEnvironment } from "@azure/arm-appcontainers";
import { LocationListStep, uiUtils, VerifyProvidersStep } from "@microsoft/vscode-azext-azureutils";
import { AzExtParentTreeItem, AzExtTreeItem, AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, DialogResponses, IActionContext, ICreateChildImplContext, parseError, TreeItemIconPath, UserCancelledError } from "@microsoft/vscode-azext-utils";
import { ProgressLocation, window } from "vscode";
import { ContainerAppCreateStep } from "../commands/createContainerApp/ContainerAppCreateStep";
import { ContainerAppNameStep } from "../commands/createContainerApp/ContainerAppNameStep";
import { EnableIngressStep } from "../commands/createContainerApp/EnableIngressStep";
import { EnvironmentVariablesListStep } from "../commands/createContainerApp/EnvironmentVariablesListStep";
import { IContainerAppContext } from "../commands/createContainerApp/IContainerAppContext";
import { ContainerRegistryListStep } from "../commands/deployImage/ContainerRegistryListStep";
import { azResourceContextValue, webProvider } from "../constants";
import { ext } from "../extensionVariables";
import { createContainerAppsAPIClient } from "../utils/azureClients";
import { getResourceGroupFromId } from "../utils/azureUtils";
import { localize } from "../utils/localize";
import { nonNullProp } from "../utils/nonNull";
import { settingUtils } from "../utils/settingUtils";
import { treeUtils } from "../utils/treeUtils";
import { ContainerAppTreeItem } from "./ContainerAppTreeItem";
import { IAzureResourceTreeItem } from './IAzureResourceTreeItem';

export class ManagedEnvironmentTreeItem extends AzExtParentTreeItem implements IAzureResourceTreeItem {
    public static contextValue: string = 'managedEnvironment';
    public static contextValueRegExp: RegExp = new RegExp(ManagedEnvironmentTreeItem.contextValue);
    public readonly contextValue: string = `${ManagedEnvironmentTreeItem.contextValue}|${azResourceContextValue}`;
    public readonly data: ManagedEnvironment;
    public resourceGroupName: string;
    public readonly childTypeLabel: string = localize('containerApp', 'Container App');

    public name: string;
    public label: string;

    constructor(parent: AzExtParentTreeItem, ke: ManagedEnvironment) {
        super(parent);
        this.data = ke;

        this.resourceGroupName = getResourceGroupFromId(this.id);
        this.name = nonNullProp(this.data, 'name');
        this.label = this.name;
    }

    public get iconPath(): TreeItemIconPath {
        return treeUtils.getIconPath('Container App Environments placeholder icon icon');
    }

    public get id(): string {
        return nonNullProp(this.data, 'id');
    }

    public async loadMoreChildrenImpl(_clearCache: boolean, context: IActionContext): Promise<AzExtTreeItem[]> {
        const client: ContainerAppsAPIClient = await createContainerAppsAPIClient([context, this]);
        // could be more efficient to call this once at Subscription level, and filter based off that but then risk stale data
        const containerApps: ContainerApp[] = (await uiUtils.listAllIterator(client.containerApps.listBySubscription()))
            .filter(ca => ca.managedEnvironmentId && ca.managedEnvironmentId === this.id)

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
        const wizardContext: IContainerAppContext = { ...context, ...this.subscription, managedEnvironmentId: this.id };

        const title: string = localize('createContainerApp', 'Create Container App');
        const promptSteps: AzureWizardPromptStep<IContainerAppContext>[] =
            [new ContainerAppNameStep(), new ContainerRegistryListStep(), new EnvironmentVariablesListStep(), new EnableIngressStep()];
        const executeSteps: AzureWizardExecuteStep<IContainerAppContext>[] = [new VerifyProvidersStep([webProvider]), new ContainerAppCreateStep()];

        wizardContext.newResourceGroupName = this.resourceGroupName;
        await LocationListStep.setLocation(wizardContext, this.data.location);

        const wizard: AzureWizard<IContainerAppContext> = new AzureWizard(wizardContext, {
            title,
            promptSteps,
            executeSteps,
            showLoadingPrompt: true
        });

        await wizard.prompt();
        context.showCreatingTreeItem(nonNullProp(wizardContext, 'newContainerAppName'));
        try {
            await wizard.execute();
        } finally {
            // refresh this node even if create fails because container app provision failure throws an error, but still creates a container app
            await this.refresh(context);
        }

        return new ContainerAppTreeItem(this, nonNullProp(wizardContext, 'containerApp'));
    }

    public async deleteTreeItemImpl(context: IActionContext): Promise<void> {
        const containerApps = <ContainerAppTreeItem[]>(await this.loadAllChildren(context));
        await promptForDelete(this, containerApps);

        if (containerApps.length) {
            await this.deleteAllContainerApps(context, containerApps);
        }

        const deleting: string = localize('DeletingManagedEnv', 'Deleting Container Apps environment "{0}"...', this.name);
        await window.withProgress({ location: ProgressLocation.Notification, title: deleting }, async (): Promise<void> => {
            const client: ContainerAppsAPIClient = await createContainerAppsAPIClient([context, this]);
            try {
                ext.outputChannel.appendLog(deleting);
                await client.managedEnvironments.beginDeleteAndWait(this.resourceGroupName, this.name);
            } catch (error) {
                const pError = parseError(error);
                // a 204 indicates a success, but sdk is catching it as an exception:
                // Received unexpected HTTP status code 204 while polling. This may indicate a server issue.
                if (Number(pError.errorType) < 200 || Number(pError.errorType) >= 300) {
                    throw error;
                }
            }
            const deleteSucceeded: string = localize('DeleteManagedEnvSucceeded', 'Successfully deleted Container Apps environment "{0}".', this.name);
            void window.showInformationMessage(deleteSucceeded);
            ext.outputChannel.appendLog(deleteSucceeded);
        });

        async function promptForDelete(node: ManagedEnvironmentTreeItem, containerApps: ContainerAppTreeItem[]): Promise<void> {
            const numOfResources = containerApps.length;
            const hasNoResources: boolean = !numOfResources;

            const deleteEnv: string = localize('ConfirmDeleteManagedEnv', 'Are you sure you want to delete Container Apps environment "{0}"?', node.name);
            const deleteEnvAndApps: string = localize('ConfirmDeleteEnvAndApps', 'Are you sure you want to delete Container Apps environment "{0}"? Deleting this will delete {1} container app(s) in this environment.',
                node.name, numOfResources);

            const deleteConfirmation: string | undefined = settingUtils.getWorkspaceSetting('deleteConfirmation');
            if (deleteConfirmation === 'ClickButton' || hasNoResources) {
                const message: string = hasNoResources ? deleteEnv : deleteEnvAndApps;
                await context.ui.showWarningMessage(message, { modal: true, stepName: 'confirmDelete' }, DialogResponses.deleteResponse); // no need to check result - cancel will throw error
            } else {
                const prompt: string = localize('enterToDelete', 'Enter "{0}" to delete this Container Apps environment. Deleting this will delete {1} container app(s) in this environment.',
                    node.name, numOfResources);

                const result: string = await context.ui.showInputBox({ prompt, validateInput });
                if (!isNameEqual(result, node)) { // Check again just in case `validateInput` didn't prevent the input box from closing
                    context.telemetry.properties.cancelStep = 'mismatchDelete';
                    throw new UserCancelledError();
                }

                function validateInput(val: string | undefined): string | undefined {
                    return isNameEqual(val, node) ? undefined : prompt;
                }

                function isNameEqual(val: string | undefined, node: ManagedEnvironmentTreeItem): boolean {
                    return !!val && val.toLowerCase() === node.name.toLowerCase();
                }
            }
        }
    }

    private async deleteAllContainerApps(context: IActionContext & { suppressPrompt?: boolean }, containerApps: ContainerAppTreeItem[]): Promise<void> {
        context.suppressPrompt = true;
        const deletePromises = containerApps.map(c => c.deleteTreeItem(context));
        await Promise.all(deletePromises);
    }
}
