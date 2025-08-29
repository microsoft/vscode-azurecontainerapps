/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, type IAzureQuickPickItem } from "@microsoft/vscode-azext-utils";
import { localize } from "../../../../utils/localize";
import { type WorkspaceDeploymentConfigurationContext } from "./WorkspaceDeploymentConfigurationContext";

export enum DeploymentMode {
    Basic = 'basic',
    Advanced = 'advanced',
}

export class DeploymentModeListStep extends AzureWizardPromptStep<WorkspaceDeploymentConfigurationContext> {
    public async prompt(context: WorkspaceDeploymentConfigurationContext): Promise<void> {
        const picks: IAzureQuickPickItem<DeploymentMode>[] = [
            {
                label: localize('basic', 'Basic'),
                detail: localize('basicDetails', 'Deploy a basic app with minimal setup. Automatically creates all required resources.'),
                data: DeploymentMode.Basic,
            },
            {
                label: localize('advanced', 'Advanced'),
                detail: localize('advancedDetails', 'Deploy an advanced app with greater customizations. Use for existing container apps.'),
                data: DeploymentMode.Advanced,
            },
        ];

        const pick = await context.ui.showQuickPick(picks, {
            placeHolder: localize('selectWorkspaceProjectDeploymentMode', 'Select the workspace project deployment mode'),
            suppressPersistence: true,
        });

        context.deploymentMode = pick.data;
        context.telemetry.properties.deploymentMode = pick.data;
    }

    public shouldPrompt(context: WorkspaceDeploymentConfigurationContext): boolean {
        return !context.deploymentConfigurationSettings && !context.deploymentMode;
    }
}
