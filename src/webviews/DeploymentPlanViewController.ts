/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from "vscode";
import { ViewColumn } from "vscode";
import { ext } from "../extensionVariables";
import { type DeploymentPlanData } from "./DeploymentPlanView";
import { WebviewController } from "./extension-server/WebviewController";

export class DeploymentPlanViewController extends WebviewController<Record<string, never>> {
    constructor(planData: DeploymentPlanData) {
        super(ext.context, 'Azure Deployment Plan', 'deploymentPlanView', {}, ViewColumn.Active);

        this.panel.webview.onDidReceiveMessage((message: { command: string }) => {
            switch (message.command) {
                case 'ready':
                    void this.panel.webview.postMessage({ command: 'setDeploymentPlanData', data: planData });
                    break;
                case 'approve':
                    void vscode.window.showInformationMessage('Deployment plan approved.');
                    this.panel.dispose();
                    break;
                case 'reject':
                    void vscode.window.showInformationMessage('Deployment plan rejected.');
                    this.panel.dispose();
                    break;
            }
        });
    }

    updateDeploymentPlanData(planData: DeploymentPlanData): void {
        void this.panel.webview.postMessage({ command: 'setDeploymentPlanData', data: planData });
    }
}
