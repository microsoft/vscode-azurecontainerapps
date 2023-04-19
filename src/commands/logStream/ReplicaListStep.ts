/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ContainerAppsAPIClient, Replica } from "@azure/arm-appcontainers";
import { AzureWizardPromptStep, IAzureQuickPickItem, createSubscriptionContext, nonNullProp, nonNullValue } from "@microsoft/vscode-azext-utils";
import * as dayjs from 'dayjs';
import { createContainerAppsAPIClient } from "../../utils/azureClients";
import { localize } from "../../utils/localize";
import { IStreamLogsContext } from "./IStreamLogsContext";

export class ReplicaListStep extends AzureWizardPromptStep<IStreamLogsContext> {
    public async prompt(context: IStreamLogsContext): Promise<void> {
        const placeHolder: string = localize('selectReplica', 'Select a Replica');
        context.replica = (await context.ui.showQuickPick(this.getPicks(context), { placeHolder })).data;
    }

    public shouldPrompt(context: IStreamLogsContext): boolean {
        return !context.replica;
    }

    public async getPicks(context: IStreamLogsContext): Promise<IAzureQuickPickItem<Replica>[]> {
        const client: ContainerAppsAPIClient = await createContainerAppsAPIClient([context, createSubscriptionContext(context.subscription)]);
        const replicas = (await client.containerAppsRevisionReplicas.listReplicas(context.resourceGroupName, context.containerApp.name, nonNullValue(context.revision?.name))).value;
        if (replicas.length === 0) {
            throw new Error(localize('noReplicas', 'No replicas found.'));
        } else {
            const replicasWithDates = replicas.map(r => {
                return { name: r.name, date: r.createdTime, data: r };
            });
            return replicasWithDates.map((r) => {
                return { label: nonNullProp(r, 'name'), description: dayjs(r.date).fromNow(), data: r.data };
            });
        }
    }
}
