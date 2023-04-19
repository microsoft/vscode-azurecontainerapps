/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ContainerAppsAPIClient, Revision } from "@azure/arm-appcontainers";
import { uiUtils } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardPromptStep, IAzureQuickPickItem, createSubscriptionContext, nonNullProp } from "@microsoft/vscode-azext-utils";
import { createContainerAppsAPIClient } from "../../utils/azureClients";
import { localize } from "../../utils/localize";
import { IStreamLogsContext } from "./IStreamLogsContext";
import dayjs = require("dayjs");


export class RevisionListStep extends AzureWizardPromptStep<IStreamLogsContext> {
    public async prompt(context: IStreamLogsContext): Promise<void> {
        if (context.containerApp.revisionsMode === 'Multiple') {
            const placeHolder: string = localize('selectRevision', 'Select a Revision');
            context.revision = (await context.ui.showQuickPick(this.getPicks(context), { placeHolder })).data;
        } else {
            (await this.getPicks(context)).forEach(revision => {
                if (revision.data.active === true) {
                    context.revision = revision.data;
                }
            });
        }
    }

    public shouldPrompt(context: IStreamLogsContext): boolean {
        return !context.revision;
    }

    public async getPicks(context: IStreamLogsContext): Promise<IAzureQuickPickItem<Revision>[]> {
        const client: ContainerAppsAPIClient = await createContainerAppsAPIClient([context, createSubscriptionContext(context.subscription)]);
        const revisions = (await uiUtils.listAllIterator(client.containerAppsRevisions.listRevisions(context.resourceGroupName, context.containerApp.name)));
        const revisionsWithDates = revisions.map(r => {
            return { name: r.name, date: r.createdTime, data: r };
        });
        return revisionsWithDates.map((r) => {
            return { label: nonNullProp(r, 'name'), description: dayjs(r.date).fromNow(), data: r.data };
        });
    }
}
