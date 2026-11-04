/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizard, AzureWizardExecuteStepWithActivityOutput, createSubscriptionContext, type ExecuteActivityContext, type IActionContext, type ISubscriptionContext } from '@microsoft/vscode-azext-utils';
import { Progress } from 'vscode';
import { ext } from '../../extensionVariables';
import { createSandboxManagementClient } from '../../sandboxes/SandboxManagementClient';
import { SandboxGroupResourceItem } from '../../sandboxes/tree/SandboxGroupResourceItem';
import { createActivityContext } from '../../utils/activityUtils';
import { createResourceManagementClient } from '../../utils/azureClients';
import { delay } from '../../utils/delay';
import { localize } from '../../utils/localize';
import { pickSandboxGroup } from '../../utils/pickItem/pickSandbox';
import { refreshSandboxGroups } from './sandboxCommandUtils';

const deletionPollIntervalMs = 1000;
const deletionPollAttempts = 30;
const sandboxGroupResourceType = 'Microsoft.App/sandboxGroups';

interface DeleteSandboxGroupContext extends IActionContext, ExecuteActivityContext, ISubscriptionContext {
    resourceGroupName: string;
    sandboxGroupId: string;
    sandboxGroupName: string;
}

export async function deleteSandboxGroup(context: IActionContext, node?: SandboxGroupResourceItem): Promise<void> {
    if (node && !SandboxGroupResourceItem.isSandboxGroupResourceItem(node)) {
        node = undefined;
    }
    node ??= await pickSandboxGroup(context);

    const confirmMessage = localize(
        'confirmDeleteSandboxGroup',
        'Are you sure you want to delete sandbox group "{0}"? All sandboxes and resources inside this group will be permanently deleted.',
        node.ref.groupName,
    );
    await context.ui.showWarningMessage(confirmMessage, { modal: true }, { title: localize('delete', 'Delete') });

    const wizardContext: DeleteSandboxGroupContext = {
        ...context,
        ...createSubscriptionContext(node.subscription),
        ...await createActivityContext(),
        activityTitle: localize('deleteSandboxGroupNamed', 'Delete sandbox group "{0}"', node.ref.groupName),
        resourceGroupName: node.ref.resourceGroup,
        sandboxGroupId: node.id,
        sandboxGroupName: node.ref.groupName,
        suppressProgress: true,
    };
    const wizard = new AzureWizard(wizardContext, {
        executeSteps: [new SandboxGroupDeleteStep()],
    });

    await ext.state.showDeleting(node.id, async () => wizard.execute());
}

class SandboxGroupDeleteStep extends AzureWizardExecuteStepWithActivityOutput<DeleteSandboxGroupContext> {
    readonly priority = 100;
    readonly stepName = 'deleteSandboxGroup';

    async execute(context: DeleteSandboxGroupContext, progress: Progress<{ message?: string; increment?: number }>): Promise<void> {
        progress.report({ message: localize('deletingSandboxGroup', 'Deleting sandbox group "{0}"...', context.sandboxGroupName) });
        const client = createSandboxManagementClient(context);
        const poller = client.sandboxGroups.beginDelete(context.resourceGroupName, context.sandboxGroupName);
        await poller.pollUntilDone();
        await waitForSandboxGroupDeletion(
            context.sandboxGroupName,
            () => client.sandboxGroups.get(context.resourceGroupName, context.sandboxGroupName),
        );

        progress.report({ message: localize('refreshingSandboxGroupsAfterDelete', 'Waiting for Azure Resources to update...') });
        const resourceClient = await createResourceManagementClient(context);
        await waitForSandboxGroupResourceListDeletion(
            context.sandboxGroupName,
            context.sandboxGroupId,
            async () => {
                const resourceIds: string[] = [];
                for await (const resource of resourceClient.resources.listByResourceGroup(context.resourceGroupName, {
                    filter: `resourceType eq '${sandboxGroupResourceType}'`,
                })) {
                    if (resource.id) {
                        resourceIds.push(resource.id);
                    }
                }
                return resourceIds;
            },
        );
        await refreshSandboxGroups();
    }

    shouldExecute(): boolean {
        return true;
    }

    protected getTreeItemLabel(context: DeleteSandboxGroupContext): string {
        return localize('deleteSandboxGroupNamed', 'Delete sandbox group "{0}"', context.sandboxGroupName);
    }

    protected getOutputLogSuccess(context: DeleteSandboxGroupContext): string {
        return localize('deletedSandboxGroup', 'Deleted sandbox group "{0}".', context.sandboxGroupName);
    }

    protected getOutputLogFail(context: DeleteSandboxGroupContext): string {
        return localize('failedToDeleteSandboxGroup', 'Failed to delete sandbox group "{0}".', context.sandboxGroupName);
    }
}

export async function waitForSandboxGroupDeletion(
    sandboxGroupName: string,
    getSandboxGroup: () => Promise<unknown>,
    wait: (ms: number) => Promise<void> = delay,
    maxAttempts: number = deletionPollAttempts,
    pollIntervalMs: number = deletionPollIntervalMs,
): Promise<void> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            await getSandboxGroup();
        } catch (error) {
            if (getStatusCode(error) === 404) {
                return;
            }
            throw error;
        }

        if (attempt < maxAttempts) {
            await wait(pollIntervalMs);
        }
    }

    throw new Error(localize(
        'sandboxGroupDeletionTimedOut',
        'Timed out waiting for sandbox group "{0}" to be deleted. Refresh the Azure Resources view to check its current state.',
        sandboxGroupName,
    ));
}

export async function waitForSandboxGroupResourceListDeletion(
    sandboxGroupName: string,
    sandboxGroupId: string,
    listResourceIds: () => Promise<readonly string[]>,
    wait: (ms: number) => Promise<void> = delay,
    maxAttempts: number = deletionPollAttempts,
    pollIntervalMs: number = deletionPollIntervalMs,
): Promise<void> {
    const normalizedSandboxGroupId = sandboxGroupId.toLowerCase();
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const resourceIds = await listResourceIds();
        if (!resourceIds.some(resourceId => resourceId.toLowerCase() === normalizedSandboxGroupId)) {
            return;
        }

        if (attempt < maxAttempts) {
            await wait(pollIntervalMs);
        }
    }

    throw new Error(localize(
        'sandboxGroupResourceListDeletionTimedOut',
        'Sandbox group "{0}" was deleted, but Azure Resources has not finished updating. Refresh the Azure Resources view to check its current state.',
        sandboxGroupName,
    ));
}

function getStatusCode(error: unknown): number | undefined {
    if (typeof error !== 'object' || error === null || !('statusCode' in error)) {
        return undefined;
    }

    const statusCode = Reflect.get(error, 'statusCode');
    return typeof statusCode === 'number' ? statusCode : undefined;
}
