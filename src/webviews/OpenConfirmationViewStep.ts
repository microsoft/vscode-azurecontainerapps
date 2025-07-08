/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, GoBackError, UserCancelledError, type ConfirmationViewProperty, type IActionContext } from "@microsoft/vscode-azext-utils";
import { ViewColumn } from "vscode";
import { ConfirmationViewController } from "./ConfirmationViewController";

export const SharedState = {
    itemsToClear: 0,
    cancelled: true
};

export class OpenConfirmationViewStep<T extends IActionContext> extends AzureWizardPromptStep<T> {
    private readonly viewConfig: () => ConfirmationViewProperty[];
    private readonly title: string;
    private readonly tabTitle: string;
    private readonly description: string;
    private readonly commandName: string;

    public constructor(title: string, tabTitle: string, description: string, commandName: string, viewConfig: () => ConfirmationViewProperty[]) {
        super();
        this.title = title;
        this.tabTitle = tabTitle
        this.description = description;
        this.viewConfig = viewConfig;
        this.commandName = commandName;
    }

    public async prompt(context: T): Promise<void> {
        const confirmationView = new ConfirmationViewController({
            title: this.title,
            tabTitle: this.tabTitle,
            description: this.description,
            commandName: this.commandName,
            items: this.viewConfig()
        });

        confirmationView.revealToForeground(ViewColumn.Active);

        await new Promise<void>((resolve, reject) => {
            confirmationView.onDisposed(() => {
                try {
                    if (SharedState.itemsToClear > 0) {
                        context.telemetry.properties.editingPicks = 'true';
                        throw new GoBackError(SharedState.itemsToClear);
                    }

                    if (SharedState.cancelled) {
                        throw new UserCancelledError('openConfirmationViewStep');
                    }
                } catch (error) {
                    reject(error);
                } finally {
                    resolve();
                }
            });
        });
    }

    public shouldPrompt(): boolean {
        return this.viewConfig().length > 0;
    }
}
