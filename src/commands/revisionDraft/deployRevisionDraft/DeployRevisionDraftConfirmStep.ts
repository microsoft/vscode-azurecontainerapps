/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerAppsAPIClient, KnownActiveRevisionsMode, Revision } from "@azure/arm-appcontainers";
import { uiUtils } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardPromptStep, nonNullProp } from "@microsoft/vscode-azext-utils";
import * as deepEqual from "deep-eql";
import { ContainerAppModel } from "../../../tree/ContainerAppItem";
import { createContainerAppsAPIClient } from "../../../utils/azureClients";
import { localize } from "../../../utils/localize";
import { IDeployRevisionDraftContext } from "./IDeployRevisionDraftContext";

export class DeployRevisionDraftConfirmStep extends AzureWizardPromptStep<IDeployRevisionDraftContext> {
    public async prompt(context: IDeployRevisionDraftContext): Promise<void> {
        const deployRevisionWarning: string = await this.hasUnsavedChanges(context) ?
            localize('deployRevisionWarning', 'This will deploy a new revision to container app "{0}".', context.containerApp?.name) :
            localize('noUnsavedChangesWarning', 'No unsaved changes detected.\n\nThis will deploy a new revision to container app "{0}".', context.containerApp?.name);

        await context.ui.showWarningMessage(
            deployRevisionWarning,
            { modal: true },
            { title: localize('continue', 'Continue') }
        );
    }

    public shouldPrompt(context: IDeployRevisionDraftContext): boolean {
        return !!context.template;
    }

    private async hasUnsavedChanges(context: IDeployRevisionDraftContext): Promise<boolean> {
        const containerApp: ContainerAppModel = nonNullProp(context, 'containerApp');

        if (context.containerApp?.revisionsMode === KnownActiveRevisionsMode.Single) {
            return !!containerApp.template && !deepEqual(containerApp.template, context.template);
        } else {
            const client: ContainerAppsAPIClient = await createContainerAppsAPIClient(context);
            const revisions: Revision[] = await uiUtils.listAllIterator(client.containerAppsRevisions.listRevisions(containerApp.resourceGroup, containerApp.name));
            const baseRevision: Revision | undefined = revisions.find(revision => revision.name === context.baseRevisionName);

            return !!baseRevision?.template && !deepEqual(baseRevision.template, context.template);
        }
    }
}
