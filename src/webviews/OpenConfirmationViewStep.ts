/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, GoBackError, type IActionContext } from "@microsoft/vscode-azext-utils";
import { ViewColumn } from "vscode";
import { ConfirmationViewController } from "./ConfirmationViewController";

export const SharedState = {
    itemsToClear: 0
};

export class OpenConfirmationViewStep<T extends IActionContext> extends AzureWizardPromptStep<T> {
    private readonly viewConfig: () => { name: string, value: string, valueInContext: string; }[];

    public constructor(viewConfig: () => { name: string, value: string, valueInContext: string; }[]) {
        super();
        this.viewConfig = viewConfig;
    }

    public async prompt(_context: T): Promise<void> {
        const confirmationView = new ConfirmationViewController(this.viewConfig());
        confirmationView.revealToForeground(ViewColumn.Active);

        await new Promise<void>((resolve, reject) => {
            confirmationView.onDisposed(() => {
                try {
                    if (SharedState.itemsToClear > 0) {
                        throw new GoBackError(SharedState.itemsToClear);
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
