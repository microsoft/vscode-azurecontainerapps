/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerAppsAPIClient, ManagedEnvironment } from "@azure/arm-appcontainers";
import { LocationListStep, ResourceGroupCreateStep, VerifyProvidersStep, uiUtils } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardExecuteStep, AzureWizardPromptStep, IAzureQuickPickItem, IWizardOptions, nonNullProp } from "@microsoft/vscode-azext-utils";
import { appProvider, managedEnvironmentsId, operationalInsightsProvider } from "../../constants";
import { createContainerAppsClient } from "../../utils/azureClients";
import { localize } from "../../utils/localize";
import { IManagedEnvironmentContext } from "./IManagedEnvironmentContext";
import { LogAnalyticsCreateStep } from "./LogAnalyticsCreateStep";
import { ManagedEnvironmentCreateStep } from "./ManagedEnvironmentCreateStep";
import { ManagedEnvironmentNameStep } from "./ManagedEnvironmentNameStep";

export class ManagedEnvironmentListStep extends AzureWizardPromptStep<IManagedEnvironmentContext> {
    public async prompt(context: IManagedEnvironmentContext): Promise<void> {
        context.managedEnvironment = (await context.ui.showQuickPick(await this.getPicks(context), {
            placeHolder: localize('managedEnvironmentListPrompt', 'Select a container apps environment'),
            suppressPersistence: true
        })).data;
    }

    public shouldPrompt(context: IManagedEnvironmentContext): boolean {
        return !context.managedEnvironment;
    }

    public async getSubWizard(context: IManagedEnvironmentContext): Promise<IWizardOptions<IManagedEnvironmentContext> | undefined> {
        if (context.managedEnvironment) {
            return undefined;
        }

        const promptSteps: AzureWizardPromptStep<IManagedEnvironmentContext>[] = [];
        const executeSteps: AzureWizardExecuteStep<IManagedEnvironmentContext>[] = [];

        if (!context.newManagedEnvironmentName) {
            promptSteps.push(new ManagedEnvironmentNameStep());
        }

        if (!context.resourceGroup) {
            // ManagedEnvironmentNameStep currently handles transferring the same name to the resource group
            executeSteps.push(new ResourceGroupCreateStep());
        }

        if (!context.deploymentMode) {
            executeSteps.push(new VerifyProvidersStep([appProvider, operationalInsightsProvider]));
        }

        executeSteps.push(
            new LogAnalyticsCreateStep(),
            new ManagedEnvironmentCreateStep()
        );

        LocationListStep.addProviderForFiltering(context, appProvider, managedEnvironmentsId);
        LocationListStep.addStep(context, promptSteps);

        return { promptSteps, executeSteps };
    }

    private async getPicks(context: IManagedEnvironmentContext): Promise<IAzureQuickPickItem<ManagedEnvironment | undefined>[]> {
        const client: ContainerAppsAPIClient = await createContainerAppsClient(context, context.subscription);
        const managedEnvironments: ManagedEnvironment[] = await uiUtils.listAllIterator(client.managedEnvironments.listBySubscription());

        return [
            { label: localize('createManagedEnvironment', '$(plus) Create container apps environment'), data: undefined },
            ...managedEnvironments.map(me => {
                return {
                    label: nonNullProp(me, 'name'),
                    data: me
                };
            })
        ];
    }
}
