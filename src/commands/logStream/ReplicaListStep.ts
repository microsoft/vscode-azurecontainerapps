/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type ContainerAppsAPIClient, type Replica } from "@azure/arm-appcontainers";
import { AzureWizardPromptStep, createSubscriptionContext, nonNullProp, nonNullValue, type IAzureQuickPickItem } from "@microsoft/vscode-azext-utils";
import * as dayjs from 'dayjs';
import { createContainerAppsAPIClient } from "../../utils/azureClients";
import { localize } from "../../utils/localize";
import { type IStreamLogsContext } from "./IStreamLogsContext";

export class ReplicaListStep extends AzureWizardPromptStep<IStreamLogsContext> {
    public async prompt(context: IStreamLogsContext): Promise<void> {
        const placeHolder: string = localize('selectReplica', 'Select a replica');
        context.replica = (await context.ui.showQuickPick(this.getPicks(context), { placeHolder })).data;
    }

    public shouldPrompt(context: IStreamLogsContext): boolean {
        return !context.replica;
    }

    private async getPicks(context: IStreamLogsContext): Promise<IAzureQuickPickItem<Replica>[]> {
        const client: ContainerAppsAPIClient = await createContainerAppsAPIClient([context, createSubscriptionContext(context.subscription)]);
        const replicas = (await client.containerAppsRevisionReplicas.listReplicas(context.resourceGroupName, context.containerApp.name, nonNullValue(context.revision?.name))).value;
        if (replicas.length === 0) {
            throw new Error(localize('noReplicas', 'No replicas found.'));
        } else {
            return replicas.map(r => {
                const date = r.createdTime;
                return { label: nonNullProp(r, 'name'), description: dayjs(date).fromNow(), data: r };
            });
        }
    }
}
