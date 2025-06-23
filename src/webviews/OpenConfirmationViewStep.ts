/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, GoBackError, UserCancelledError, type IActionContext } from "@microsoft/vscode-azext-utils";
import { ViewColumn } from "vscode";
import { ConfirmationViewController } from "./ConfirmationViewController";

export const SharedState = {
    itemsToClear: 0,
    cancelled: false
};

export class OpenConfirmationViewStep<T extends IActionContext> extends AzureWizardPromptStep<T> {
    private readonly viewConfig: () => { name: string, value: string, valueInContext: string; }[];
    private readonly title: string;

    public constructor(title: string, viewConfig: () => { name: string, value: string, valueInContext: string; }[]) {
        super();
        this.title = title;
        this.viewConfig = viewConfig;
    }

    public async prompt(_context: T): Promise<void> {
        const confirmationView = new ConfirmationViewController({
            title: this.title,
            items: this.viewConfig()
        });

        confirmationView.revealToForeground(ViewColumn.Active);

        await new Promise<void>((resolve, reject) => {
            confirmationView.onDisposed(() => {
                try {
                    if (SharedState.itemsToClear > 0) {
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
