/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzExtFsExtra, AzureWizardExecuteStep, nonNullValueAndProp } from "@microsoft/vscode-azext-utils";
import * as path from "path";
import { type Progress } from "vscode";
import { IDeployWorkspaceProjectContext } from "./deployWorkspaceProject";

interface IContainerAppDeploySettings {
    containerAppName: string;
    acrName: string;
}

export class DeployWorkspaceConfigurationSaveStep extends AzureWizardExecuteStep<IDeployWorkspaceProjectContext> {
    public priority: number = 1480;

    public async execute(context: IDeployWorkspaceProjectContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const rootPath: string = nonNullValueAndProp(context.rootFolder?.uri, 'path');
        const settingsPath = path.join(rootPath, '.vscode', 'settings.json');

        // Try/catch this, if user cancels, then just exit early without making any changes
        if (!await AzExtFsExtra.pathExists(settingsPath)) {
            // Ask to create a new settings file
        } else {
            // Ask to overwrite existing settings file
        }

        const settingsContent: IContainerAppDeploySettings = {
            containerAppName: nonNullValueAndProp(context.containerApp, 'name'),
            acrName: nonNullValueAndProp(context.registry, 'name')
        };

        try {
            await AzExtFsExtra.writeFile(settingsPath, JSON.stringify(settingsContent));
        } catch (e) {
            // Output unable to write to settings file message
            console.log("temp");
            throw e;
        }
    }

    public shouldExecute(): boolean {
        return true;
    }
}
