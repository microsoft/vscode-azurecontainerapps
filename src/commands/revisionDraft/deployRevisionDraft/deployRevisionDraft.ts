/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode } from "@azure/arm-appcontainers";
import { AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, IActionContext, createSubscriptionContext, nonNullValue, nonNullValueAndProp } from "@microsoft/vscode-azext-utils";
import { ext } from "../../../extensionVariables";
import type { ContainerAppItem } from "../../../tree/ContainerAppItem";
import { RevisionDraftItem } from "../../../tree/revisionManagement/RevisionDraftItem";
import { createActivityContext } from "../../../utils/activityUtils";
import { delay } from "../../../utils/delay";
import { localize } from "../../../utils/localize";
import { pickContainerApp } from "../../../utils/pickContainerApp";
import { DeployRevisionDraftConfirmStep } from "./DeployRevisionDraftConfirmStep";
import { DeployRevisionDraftStep } from "./DeployRevisionDraftStep";
import type { IDeployRevisionDraftContext } from "./IDeployRevisionDraftContext";

export async function deployRevisionDraft(context: IActionContext, node?: ContainerAppItem | RevisionDraftItem): Promise<void> {
    const item = node ?? await pickContainerApp(context);

    if (!ext.revisionDraftFileSystem.doesContainerAppsItemHaveRevisionDraft(item)) {
        throw new Error(localize('noDraftExists', 'No draft changes exist for container app "{0}".', item.containerApp.name));
    }

    const { subscription, containerApp } = item;

    const wizardContext: IDeployRevisionDraftContext = {
        ...context,
        ...createSubscriptionContext(subscription),
        ...(await createActivityContext()),
        subscription,
        containerApp,
        baseRevisionName: nonNullValueAndProp(ext.revisionDraftFileSystem.getRevisionDraftFile(item), 'baseRevisionName'),
        template: nonNullValue(ext.revisionDraftFileSystem.parseRevisionDraft(item)),
    };

    const promptSteps: AzureWizardPromptStep<IDeployRevisionDraftContext>[] = [
        new DeployRevisionDraftConfirmStep()
    ];

    const executeSteps: AzureWizardExecuteStep<IDeployRevisionDraftContext>[] = [
        new DeployRevisionDraftStep()
    ];

    const wizard: AzureWizard<IDeployRevisionDraftContext> = new AzureWizard(wizardContext, {
        title: localize('deploy', 'Deploy changes to container app "{0}"', containerApp.name),
        promptSteps,
        executeSteps,
    });

    await wizard.prompt();
    await wizard.execute();

    if (item.containerApp.revisionsMode === KnownActiveRevisionsMode.Single) {
        ext.revisionDraftFileSystem.discardRevisionDraft(item);
    } else {
        await ext.state.showDeleting(
            `${item.containerApp.id}/${RevisionDraftItem.idSuffix}`,
            async () => {
                // Add a short delay to display the deleting message
                await delay(5);
                ext.revisionDraftFileSystem.discardRevisionDraft(item);
            }
        );
    }

    ext.state.notifyChildrenChanged(item.containerApp.managedEnvironmentId);
}
