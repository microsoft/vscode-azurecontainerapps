/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode } from "@azure/arm-appcontainers";
import { AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, IActionContext, createSubscriptionContext, nonNullValue } from "@microsoft/vscode-azext-utils";
import { ext } from "../../../extensionVariables";
import type { ContainerAppItem } from "../../../tree/ContainerAppItem";
import { RevisionDraftItem } from "../../../tree/revisionManagement/RevisionDraftItem";
import { createActivityContext } from "../../../utils/activity/activityUtils";
import { addAzdTelemetryToContext } from "../../../utils/azdUtils";
import { delay } from "../../../utils/delay";
import { localize } from "../../../utils/localize";
import { pickContainerApp } from "../../../utils/pickItem/pickContainerApp";
import { pickRevisionDraft } from "../../../utils/pickItem/pickRevision";
import type { RevisionDraftFile } from "../RevisionDraftFileSystem";
import { DeployRevisionDraftConfirmStep } from "./DeployRevisionDraftConfirmStep";
import type { DeployRevisionDraftContext } from "./DeployRevisionDraftContext";
import { DeployRevisionDraftStep } from "./DeployRevisionDraftStep";

export async function deployRevisionDraft(context: IActionContext, node?: ContainerAppItem | RevisionDraftItem): Promise<void> {
    if (!node) {
        const containerAppItem: ContainerAppItem = await pickContainerApp(context);
        node = containerAppItem.containerApp.revisionsMode === KnownActiveRevisionsMode.Single ? containerAppItem : await pickRevisionDraft(context, containerAppItem);
    }

    const item: ContainerAppItem | RevisionDraftItem = nonNullValue(node);
    const { subscription, containerApp } = item;

    const wizardContext: DeployRevisionDraftContext = {
        ...context,
        ...createSubscriptionContext(subscription),
        ...(await createActivityContext()),
        subscription,
        containerApp,
        template: ext.revisionDraftFileSystem.parseRevisionDraft(item),
    };

    if (!await item.hasUnsavedChanges()) {
        throw new Error(localize('noUnsavedChanges', 'No unsaved changes detected to deploy to container app "{0}".', containerApp.name));
    }

    // Set telemetry
    const file: RevisionDraftFile | undefined = ext.revisionDraftFileSystem.getRevisionDraftFile(item);
    wizardContext.telemetry.properties.commandUpdatesCount = String(file?.commandUpdatesCount ?? 0);
    wizardContext.telemetry.properties.directUpdatesCount = String(file?.directUpdatesCount ?? 0);
    wizardContext.telemetry.properties.revisionMode = containerApp.revisionsMode;

    await addAzdTelemetryToContext(wizardContext);

    const promptSteps: AzureWizardPromptStep<DeployRevisionDraftContext>[] = [
        new DeployRevisionDraftConfirmStep()
    ];

    const executeSteps: AzureWizardExecuteStep<DeployRevisionDraftContext>[] = [
        new DeployRevisionDraftStep()
    ];

    const wizard: AzureWizard<DeployRevisionDraftContext> = new AzureWizard(wizardContext, {
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
            RevisionDraftItem.getRevisionDraftItemId(item.containerApp.id),
            async () => {
                // Add a short delay to display the deleting message
                await delay(5);
                ext.revisionDraftFileSystem.discardRevisionDraft(item);
            }
        );
    }

    ext.state.notifyChildrenChanged(item.containerApp.managedEnvironmentId);
}
