/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type SandboxGroup } from '@azure/containerapps-sandbox';
import { IResourceGroupWizardContext, LocationListStep, ResourceGroupCreateStep, ResourceGroupListStep, resourceGroupNamingRules } from '@microsoft/vscode-azext-azureutils';
import { AzureNameStep, AzureWizard, AzureWizardExecuteStepWithActivityOutput, createSubscriptionContext, nonNullProp, subscriptionExperience, type AzureWizardPromptStep, type ExecuteActivityContext, type IActionContext, type ISubscriptionContext } from '@microsoft/vscode-azext-utils';
import { type AzureSubscription } from '@microsoft/vscode-azureresources-api';
import { randomBytes } from 'crypto';
import { Progress, l10n, window } from 'vscode';
import { ext } from '../../extensionVariables';
import { createSandboxManagementClient } from '../../sandboxes/SandboxManagementClient';
import { type SandboxGroupRef } from '../../sandboxes/sandboxTypes';
import { createActivityContext } from '../../utils/activityUtils';
import { localize } from '../../utils/localize';
import { createSandboxInGroup } from './createSandbox';
import { refreshSandboxGroups } from './sandboxCommandUtils';

interface CreateSandboxGroupContext extends IResourceGroupWizardContext, ExecuteActivityContext, ISubscriptionContext {
    createdSandboxGroup?: SandboxGroup;
    newSandboxGroupName?: string;
    subscription: AzureSubscription;
}

export async function createSandboxGroup(context: IActionContext, node?: { subscription?: Pick<AzureSubscription, 'subscriptionId'> }): Promise<void> {
    const subscription = await subscriptionExperience(context, ext.rgApiV2.resources.azureResourceTreeDataProvider, {
        selectBySubscriptionId: node?.subscription?.subscriptionId,
        showLoadingPrompt: node?.subscription?.subscriptionId === undefined,
    });
    const wizardContext: CreateSandboxGroupContext = {
        ...context,
        ...createSubscriptionContext(subscription),
        ...await createActivityContext({ withChildren: true }),
        subscription,
        suppress403Handling: true,
        suppressProgress: true,
    };

    const promptSteps: AzureWizardPromptStep<CreateSandboxGroupContext>[] = [
        new SandboxGroupNameStep(),
        new ResourceGroupListStep(),
    ];
    LocationListStep.addStep(wizardContext, promptSteps);

    const wizard = new AzureWizard(wizardContext, {
        title: localize('createSandboxGroup', 'Create Sandbox Group'),
        promptSteps,
        executeSteps: [
            new ResourceGroupCreateStep(),
            new SandboxGroupCreateStep(),
        ],
    });

    await wizard.prompt();
    const sandboxGroupName = nonNullProp(wizardContext, 'newSandboxGroupName');
    wizardContext.activityTitle = localize('createSandboxGroupNamed', 'Create sandbox group "{0}"', sandboxGroupName);
    await wizard.execute();
    await refreshSandboxGroups();

    const yes = l10n.t('Yes');
    const no = l10n.t('No');
    const createSandbox = await window.showInformationMessage(
        l10n.t('Would you like to create a sandbox in sandbox group "{0}" now?', sandboxGroupName),
        { modal: true },
        yes,
        no,
    );
    if (createSandbox === yes) {
        const resourceGroupName = nonNullProp(nonNullProp(wizardContext, 'resourceGroup'), 'name');
        const sandboxGroup = nonNullProp(wizardContext, 'createdSandboxGroup');
        const ref: SandboxGroupRef = {
            subscriptionId: subscription.subscriptionId,
            resourceGroup: resourceGroupName,
            groupName: sandboxGroup.name,
            region: sandboxGroup.location,
        };
        await createSandboxInGroup(context, subscription, ref);
    }
}

class SandboxGroupNameStep extends AzureNameStep<CreateSandboxGroupContext> {
    async prompt(context: CreateSandboxGroupContext): Promise<void> {
        context.newSandboxGroupName = await context.ui.showInputBox({
            prompt: l10n.t('Enter a name for the sandbox group.'),
            value: generateSandboxGroupName(),
            validateInput: validateSandboxGroupName,
        });
        context.relatedNameTask = this.generateRelatedName(context, context.newSandboxGroupName, resourceGroupNamingRules);
    }

    shouldPrompt(context: CreateSandboxGroupContext): boolean {
        return !context.newSandboxGroupName;
    }

    protected isRelatedNameAvailable(context: CreateSandboxGroupContext, name: string): Promise<boolean> {
        return ResourceGroupListStep.isNameAvailable(context, name);
    }
}

class SandboxGroupCreateStep extends AzureWizardExecuteStepWithActivityOutput<CreateSandboxGroupContext> {
    readonly priority = 200;
    readonly stepName = 'createSandboxGroup';

    async execute(context: CreateSandboxGroupContext, progress: Progress<{ message?: string; increment?: number }>): Promise<void> {
        const name = nonNullProp(context, 'newSandboxGroupName');
        const resourceGroupName = nonNullProp(nonNullProp(context, 'resourceGroup'), 'name');
        const location = await LocationListStep.getLocation(context);
        progress.report({ message: localize('creatingSandboxGroup', 'Creating sandbox group "{0}"...', name) });

        const client = createSandboxManagementClient(context);
        const poller = client.sandboxGroups.beginCreateOrUpdate(resourceGroupName, name, { location: location.name });
        context.createdSandboxGroup = await poller.pollUntilDone();
    }

    shouldExecute(): boolean {
        return true;
    }

    protected getTreeItemLabel(context: CreateSandboxGroupContext): string {
        return localize('createSandboxGroupNamed', 'Create sandbox group "{0}"', nonNullProp(context, 'newSandboxGroupName'));
    }

    protected getOutputLogSuccess(context: CreateSandboxGroupContext): string {
        return localize('createdSandboxGroup', 'Created sandbox group "{0}".', nonNullProp(context, 'newSandboxGroupName'));
    }

    protected getOutputLogFail(context: CreateSandboxGroupContext): string {
        return localize('failedToCreateSandboxGroup', 'Failed to create sandbox group "{0}".', nonNullProp(context, 'newSandboxGroupName'));
    }
}

export function validateSandboxGroupName(name: string): string | undefined {
    if (!/^[a-z](?:[a-z0-9-]{0,30}[a-z0-9])?$/.test(name)) {
        return l10n.t('The name must be 1-32 characters, contain only lowercase letters, numbers, and hyphens, start with a letter, and end with a letter or number.');
    }

    return undefined;
}

export function generateSandboxGroupName(randomBytesProvider: (size: number) => Buffer = randomBytes): string {
    return `sandbox-group-${randomBytesProvider(2).toString('hex')}`;
}
