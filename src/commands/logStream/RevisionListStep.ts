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
        if (context.containerApp.revisionsMode === 'Multiple') {
            const placeHolder: string = localize('selectRevision', 'Select a revision');
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

    private async getPicks(context: IStreamLogsContext): Promise<IAzureQuickPickItem<Revision>[]> {
        const client: ContainerAppsAPIClient = await createContainerAppsAPIClient([context, createSubscriptionContext(context.subscription)]);
        const revisions = (await uiUtils.listAllIterator(client.containerAppsRevisions.listRevisions(context.resourceGroupName, context.containerApp.name)));
        return revisions.map(r => {
            const date = r.createdTime;
            return { label: nonNullProp(r, 'name'), description: dayjs(date).fromNow(), data: r };
        });
    }
}
