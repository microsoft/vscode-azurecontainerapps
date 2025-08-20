/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, type IActionContext } from "@microsoft/vscode-azext-utils";
import * as vscode from 'vscode';
import { localize } from "../utils/localize";
import { LoadingViewController } from "./LoadingViewController";
import { SharedState } from "./OpenConfirmationViewStep";



export class OpenLoadingViewStep<T extends IActionContext> extends AzureWizardPromptStep<T> {
    public async prompt(): Promise<void> {
        const loadingView = new LoadingViewController({ title: localize('loadingViewTitle', 'Loading...') });
        loadingView.revealToForeground(vscode.ViewColumn.Active);
        SharedState.currentPanel = loadingView.panel;
    }

    public shouldPrompt(): boolean {
        return true;
    }
}
