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
import { localize } from '../../utils/localize';
import { pickSandboxGroup } from '../../utils/pickItem/pickSandbox';
import { refreshSandboxGroups } from './sandboxCommandUtils';

interface DeleteSandboxGroupContext extends IActionContext, ExecuteActivityContext, ISubscriptionContext {
    resourceGroupName: string;
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
        sandboxGroupName: node.ref.groupName,
        suppressProgress: true,
    };
    const wizard = new AzureWizard(wizardContext, {
        executeSteps: [new SandboxGroupDeleteStep()],
    });

    await ext.state.showDeleting(node.id, async () => wizard.execute());
    await refreshSandboxGroups();
}

class SandboxGroupDeleteStep extends AzureWizardExecuteStepWithActivityOutput<DeleteSandboxGroupContext> {
    readonly priority = 100;
    readonly stepName = 'deleteSandboxGroup';

    async execute(context: DeleteSandboxGroupContext, progress: Progress<{ message?: string; increment?: number }>): Promise<void> {
        progress.report({ message: localize('deletingSandboxGroup', 'Deleting sandbox group "{0}"...', context.sandboxGroupName) });
        const client = createSandboxManagementClient(context);
        const poller = client.sandboxGroups.beginDelete(context.resourceGroupName, context.sandboxGroupName);
        await poller.pollUntilDone();
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
