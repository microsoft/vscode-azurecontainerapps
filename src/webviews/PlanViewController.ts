/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from "vscode";
import { ViewColumn } from "vscode";
import { ext } from "../extensionVariables";
import { collectIconRequests } from "../utils/iconTheme/collectIconRequests";
import { IconThemeService } from "../utils/iconTheme/IconThemeService";
import { type PlanData } from "../utils/parsePlanMarkdown";
import { WebviewController } from "./extension-server/WebviewController";

export class PlanViewController extends WebviewController<Record<string, never>> {
    private readonly _iconThemeService = new IconThemeService();
    private _planData: PlanData;

    constructor(planData: PlanData) {
        super(ext.context, 'Project Plan', 'planView', {}, ViewColumn.Active);

        this._planData = planData;

        this.panel.webview.onDidReceiveMessage((message: { command: string; data?: PlanData; prompt?: string }) => {
            switch (message.command) {
                case 'ready':
                    void this.panel.webview.postMessage({ command: 'setPlanData', data: this._planData });
                    void this._pushIconTheme();
                    break;
                case 'approvePlan':
                    void vscode.commands.executeCommand('azureProjectCreation.completeStep', 'projectCreation/plan/definePlan');
                    void vscode.commands.executeCommand('workbench.action.chat.open', {
                        mode: 'agent',
                        query: 'I approve the plan.',
                    });
                    this.panel.dispose();
                    break;
                case 'submitPlanFeedback': {
                    const query = message.prompt?.trim();
                    if (!query) {
                        return;
                    }
                    // Hand off to Copilot agent to revise project-plan.md. Keep the webview
                    // open; it will refresh in place when the file is rewritten.
                    void vscode.commands.executeCommand('workbench.action.chat.open', {
                        mode: 'agent',
                        query,
                    });
                    void this.panel.webview.postMessage({ command: 'revisionInProgress' });
                    break;
                }
            }
        });

        this.registerDisposable(this._iconThemeService.onDidChange(() => {
            void this._pushIconTheme();
        }));
        this.registerDisposable(this._iconThemeService);
    }

    updatePlanData(planData: PlanData): void {
        this._planData = planData;
        void this.panel.webview.postMessage({ command: 'setPlanData', data: planData });
        void this.panel.webview.postMessage({ command: 'revisionComplete' });
        void this._pushIconTheme();
    }

    private async _pushIconTheme(): Promise<void> {
        // Allow the webview to load resources from the active icon-theme extension's folder.
        // Must be updated before `asWebviewUri` URIs are actually fetched by the webview.
        const themeExtUri = await this._iconThemeService.ensureThemeExtensionUri();
        this.setExtraResourceRoots(themeExtUri ? [themeExtUri] : []);

        const requests = collectIconRequests(this._planData);
        const payload = await this._iconThemeService.buildPayload(requests, this.panel.webview);
        void this.panel.webview.postMessage({ command: 'setIconTheme', data: payload });
    }
}
