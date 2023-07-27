/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerAppsAPIClient, KnownActiveRevisionsMode, Revision } from "@azure/arm-appcontainers";
import { uiUtils } from "@microsoft/vscode-azext-azureutils";
import { AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, IActionContext, createSubscriptionContext, nonNullProp, nonNullValue, nonNullValueAndProp } from "@microsoft/vscode-azext-utils";
import * as deepEqual from "deep-eql";
import { ext } from "../../../extensionVariables";
import type { ContainerAppItem, ContainerAppModel } from "../../../tree/ContainerAppItem";
import { RevisionDraftItem } from "../../../tree/revisionManagement/RevisionDraftItem";
import { createActivityContext } from "../../../utils/activityUtils";
import { createContainerAppsAPIClient } from "../../../utils/azureClients";
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
        template: nonNullValue(ext.revisionDraftFileSystem.parseRevisionDraft(item)),
    };

    if (!await hasUnsavedChanges(wizardContext, item)) {
        throw new Error(localize('noUnsavedChanges', 'No unsaved changes detected to deploy to container app "{0}".', containerApp.name));
    }

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

async function hasUnsavedChanges(context: IDeployRevisionDraftContext, item: ContainerAppItem | RevisionDraftItem): Promise<boolean> {
    const containerApp: ContainerAppModel = nonNullProp(context, 'containerApp');

    if (context.containerApp?.revisionsMode === KnownActiveRevisionsMode.Single) {
        return !!containerApp.template && !deepEqual(containerApp.template, context.template);
    } else {
        const client: ContainerAppsAPIClient = await createContainerAppsAPIClient(context);
        const revisions: Revision[] = await uiUtils.listAllIterator(client.containerAppsRevisions.listRevisions(containerApp.resourceGroup, containerApp.name));

        const baseRevisionName: string = nonNullValueAndProp(ext.revisionDraftFileSystem.getRevisionDraftFile(item), 'baseRevisionName');
        const baseRevision: Revision | undefined = revisions.find(revision => revision.name === baseRevisionName);

        return !!baseRevision?.template && !deepEqual(baseRevision.template, context.template);
    }
}
