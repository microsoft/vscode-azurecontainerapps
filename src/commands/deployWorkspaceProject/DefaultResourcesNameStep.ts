/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from "@microsoft/vscode-azext-utils";
import { IDeployWorkspaceProjectContext } from "./IDeployWorkspaceProjectContext";

export class DefaultResourcesNameStep extends AzureWizardPromptStep<IDeployWorkspaceProjectContext> {
    public async prompt(context: IDeployWorkspaceProjectContext): Promise<void> {
        // Write name logic
    }

    public shouldPrompt(context: IDeployWorkspaceProjectContext): boolean {
        return !context.resourceGroup || !context.managedEnvironment || !context.registry || !context.containerApp;
    }
}
