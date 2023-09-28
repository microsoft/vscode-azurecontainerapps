/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardExecuteStep, nonNullProp, nonNullValueAndProp } from "@microsoft/vscode-azext-utils";
import { type Progress } from "vscode";
import { localize } from "../../utils/localize";
import { DeployWorkspaceProjectContext } from "./DeployWorkspaceProjectContext";
import { DeployWorkspaceProjectSettings, setDeployWorkspaceProjectSettings } from "./deployWorkspaceProjectSettings";

export class DeployWorkspaceProjectSaveSettingsStep extends AzureWizardExecuteStep<DeployWorkspaceProjectContext> {
    public priority: number = 1480;

    public async execute(context: DeployWorkspaceProjectContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        progress.report({ message: localize('saving', 'Saving configuration...') });

        const settings: DeployWorkspaceProjectSettings = {
            containerAppResourceGroupName: nonNullValueAndProp(context.resourceGroup, 'name'),
            containerAppName: nonNullValueAndProp(context.containerApp, 'name'),
            containerRegistryName: nonNullValueAndProp(context.registry, 'name')
        };

        await setDeployWorkspaceProjectSettings(nonNullProp(context, 'rootFolder'), settings);
    }

    public shouldExecute(context: DeployWorkspaceProjectContext): boolean {
        return !!context.shouldSaveDeploySettings;
    }
}
