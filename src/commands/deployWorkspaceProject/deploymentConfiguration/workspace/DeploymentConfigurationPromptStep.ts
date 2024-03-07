/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from "@microsoft/vscode-azext-utils";
import { type WorkspaceDeploymentConfigurationContext } from "./WorkspaceDeploymentConfigurationContext";

export class DeploymentConfigurationPromptStep extends AzureWizardPromptStep<WorkspaceDeploymentConfigurationContext> {
    public async prompt(_: WorkspaceDeploymentConfigurationContext): Promise<void> {
        //
    }

    public shouldPrompt(_: WorkspaceDeploymentConfigurationContext): boolean {
        return true;
    }
}
