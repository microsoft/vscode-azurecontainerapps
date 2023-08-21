/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerApp, ContainerAppsAPIClient, KnownActiveRevisionsMode, Revision, ScaleRule } from '@azure/arm-appcontainers';
import { AzureWizardPromptStep } from '@microsoft/vscode-azext-utils';
import { createContainerAppsAPIClient } from '../../../utils/azureClients';
import { localize } from '../../../utils/localize';
import type { IAddScaleRuleContext } from './IAddScaleRuleContext';

export class ScaleRuleNameStep extends AzureWizardPromptStep<IAddScaleRuleContext> {
    public hideStepCount: boolean = true;

    public async prompt(context: IAddScaleRuleContext): Promise<void> {
        context.newRuleName = (await context.ui.showInputBox({
            prompt: localize('scaleRuleNamePrompt', 'Enter a name for the new scale rule.'),
            validateInput: this.validateInput,
            asyncValidationTask: (name: string) => this.validateNameAvailable(context, name)
        })).trim();
    }

    public shouldPrompt(context: IAddScaleRuleContext): boolean {
        return !context.newRuleName;
    }

    private validateInput(name: string | undefined): string | undefined {
        name = name ? name.trim() : '';

        if (!/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/.test(name)) {
            return localize('invalidChar', `A name must consist of lower case alphanumeric characters or '-', and must start and end with an alphanumeric character.`);
        }

        return undefined;
    }

    private async validateNameAvailable(context: IAddScaleRuleContext, name: string): Promise<string | undefined> {
        const client: ContainerAppsAPIClient = await createContainerAppsAPIClient(context);
        const resourceGroupName: string = context.containerApp.resourceGroup;

        let scaleRules: ScaleRule[] | undefined;
        if (context.containerApp.revisionsMode === KnownActiveRevisionsMode.Single) {
            const containerApp: ContainerApp = await client.containerApps.get(resourceGroupName, context.parentResourceName);
            scaleRules = containerApp.template?.scale?.rules ?? [];
        } else {
            const revision: Revision = await client.containerAppsRevisions.getRevision(resourceGroupName, context.containerApp.name, context.parentResourceName);
            scaleRules = revision.template?.scale?.rules ?? [];
        }

        const scaleRuleExists: boolean = !!scaleRules?.some((rule) => {
            return rule.name?.length && rule.name === name;
        });

        if (scaleRuleExists) {
            return localize('scaleRuleExists', 'The scale rule "{0}" already exists in container app "{1}". Please enter a unique name.', name, context.containerApp.name);
        }

        return undefined;
    }
}
