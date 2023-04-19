/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ReplicaContainer } from "@azure/arm-appcontainers";
import { AzureWizardPromptStep, IAzureQuickPickItem, nonNullProp, nonNullValue } from "@microsoft/vscode-azext-utils";
import { localize } from "../../utils/localize";
import { IStreamLogsContext } from "./IStreamLogsContext";

export class ContainerListStep extends AzureWizardPromptStep<IStreamLogsContext> {
    public async prompt(context: IStreamLogsContext): Promise<void> {
        const placeHolder: string = localize('selectContainer', 'Select a Container');
        context.container = (await context.ui.showQuickPick(this.getPicks(context), { placeHolder })).data;
    }

    public shouldPrompt(context: IStreamLogsContext): boolean {
        return !context.container;
    }

    public async getPicks(context: IStreamLogsContext): Promise<IAzureQuickPickItem<ReplicaContainer>[]> {
        return nonNullValue(context.replica?.containers).map((c) => {
            return { label: nonNullProp(c, 'name'), data: c, suppressPersistance: true };
        })
    }
}
