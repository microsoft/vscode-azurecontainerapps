/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import type { ContainerAppsAPIClient, Revision } from "@azure/arm-appcontainers";
import { uiUtils } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardPromptStep, IAzureQuickPickItem, createSubscriptionContext, nonNullProp } from "@microsoft/vscode-azext-utils";
import * as dayjs from 'dayjs';
import { createContainerAppsAPIClient } from "../../utils/azureClients";
import { localize } from "../../utils/localize";
import { IStreamLogsContext } from "./IStreamLogsContext";

export class RevisionListStep extends AzureWizardPromptStep<IStreamLogsContext> {
    public async prompt(context: IStreamLogsContext): Promise<void> {
        const placeHolder: string = localize('selectRevision', 'Select a revision');
        context.revision = (await context.ui.showQuickPick(this.getPicks(context), { placeHolder })).data;
    }

    public async configureBeforePrompt(context: IStreamLogsContext): Promise<void> {
        const picks = await this.getPicks(context);
        if (context.containerApp.revisionsMode === 'Multiple' && picks.length === 1) {
            context.revision = picks[0].data;
        } else if (context.containerApp.revisionsMode === 'Single') {
            const client: ContainerAppsAPIClient = await createContainerAppsAPIClient([context, createSubscriptionContext(context.subscription)]);
            const revisionData = await client.containerAppsRevisions.getRevision(context.resourceGroupName, context.containerApp.name, nonNullProp(context.containerApp, 'latestRevisionName'));
            context.revision = revisionData;
        }
    }

    public shouldPrompt(context: IStreamLogsContext): boolean {
        return !context.revision;
    }

    private async getPicks(context: IStreamLogsContext): Promise<IAzureQuickPickItem<Revision>[]> {
        const client: ContainerAppsAPIClient = await createContainerAppsAPIClient([context, createSubscriptionContext(context.subscription)]);
        const revisions = (await uiUtils.listAllIterator(client.containerAppsRevisions.listRevisions(context.resourceGroupName, context.containerApp.name)));
        return revisions.map(r => {
            const date = r.createdTime;
            return { label: nonNullProp(r, 'name'), description: dayjs(date).fromNow(), data: r };
        });
    }
}
