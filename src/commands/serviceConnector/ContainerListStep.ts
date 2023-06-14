/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, IAzureQuickPickItem, nonNullValue } from "@microsoft/vscode-azext-utils";
import { localize } from "../../utils/localize";
import { IServiceConnectorContext } from "./IServiceConnectorContext";

export class ContainerListStep extends AzureWizardPromptStep<IServiceConnectorContext> {
    public async prompt(context: IServiceConnectorContext): Promise<void> {
        const placeHolder: string = localize('selectContainer', 'Select a container');
        context.scope = (await context.ui.showQuickPick(this.getPicks(context), { placeHolder })).data;
    }

    public shouldPrompt(context: IServiceConnectorContext): boolean {
        return !context.scope;
    }

    public async configureBeforePrompt(context: IServiceConnectorContext): Promise<void> {
        const picks = this.getPicks(context);
        if (picks.length === 1) {
            context.scope = picks[0].data;
        }
    }

    private getPicks(context: IServiceConnectorContext): IAzureQuickPickItem<string>[] {
        const containers = nonNullValue(context.containerApp?.template?.containers);
        return containers.map(c => {
            return {
                label: nonNullValue(c.name),
                data: nonNullValue(c.name)
            }
        })
    }
}
