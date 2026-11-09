/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContextValueQuickPickStep, QuickPickAzureSubscriptionStep, QuickPickGroupStep, runQuickPickWizard, type AzureResourceQuickPickWizardContext, type AzureWizardPromptStep, type IActionContext, type QuickPickWizardContext } from '@microsoft/vscode-azext-utils';
import { AzExtResourceType, type ResourceGroupsTreeDataProvider } from '@microsoft/vscode-azureresources-api';
import { ext } from '../../extensionVariables';
import { SandboxGroupResourceItem } from '../../sandboxes/tree/SandboxGroupResourceItem';
import { SandboxItem } from '../../sandboxes/tree/SandboxItem';
import { localize } from '../localize';

const sandboxGroupResourceType = 'ContainerAppsSandboxGroups' as AzExtResourceType;
type SandboxStateFilter = 'running' | 'suspended';

export function getSandboxContextValueFilter(stateFilter?: SandboxStateFilter): RegExp {
    return stateFilter ? new RegExp(`^${stateFilter}$`, 'i') : SandboxItem.contextValueRegExp;
}

function getPickSandboxGroupSteps(): AzureWizardPromptStep<AzureResourceQuickPickWizardContext>[] {
    const treeDataProvider: ResourceGroupsTreeDataProvider = ext.rgApiV2.resources.azureResourceTreeDataProvider;

    return [
        new QuickPickAzureSubscriptionStep(treeDataProvider),
        new QuickPickGroupStep(treeDataProvider, {
            groupType: [sandboxGroupResourceType],
        }),
        new ContextValueQuickPickStep(treeDataProvider, {
            contextValueFilter: { include: new RegExp(SandboxGroupResourceItem.contextValue, 'i') },
        }, {
            placeHolder: localize('selectSandboxGroup', 'Select a sandbox group'),
            noPicksMessage: localize('noSandboxGroups', 'Selected subscription has no sandbox groups'),
        }),
    ];
}

export async function pickSandboxGroup(context: IActionContext): Promise<SandboxGroupResourceItem> {
    const promptSteps: AzureWizardPromptStep<QuickPickWizardContext>[] = getPickSandboxGroupSteps();
    return await runQuickPickWizard(context, { promptSteps });
}

export async function pickSandbox(context: IActionContext, stateFilter?: SandboxStateFilter): Promise<SandboxItem> {
    const treeDataProvider: ResourceGroupsTreeDataProvider = ext.rgApiV2.resources.azureResourceTreeDataProvider;
    const promptSteps: AzureWizardPromptStep<QuickPickWizardContext>[] = [
        ...getPickSandboxGroupSteps(),
        new ContextValueQuickPickStep(treeDataProvider, {
            contextValueFilter: {
                include: getSandboxContextValueFilter(stateFilter),
            },
        }, {
            placeHolder: localize('selectSandbox', 'Select a sandbox'),
            noPicksMessage: stateFilter === 'running'
                ? localize('noRunningSandboxes', 'Selected sandbox group has no running sandboxes')
                : stateFilter === 'suspended'
                    ? localize('noSuspendedSandboxes', 'Selected sandbox group has no stopped or suspended sandboxes')
                    : localize('noSandboxes', 'Selected sandbox group has no sandboxes'),
        }),
    ];

    return await runQuickPickWizard(context, { promptSteps });
}
